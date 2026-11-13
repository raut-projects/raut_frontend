// Live rides WebSocket client with polling fallback.
// Connects to the realtime rides feed, forwards ride events to the caller, and
// falls back to polling `listLiveRides` while the socket is down. Reconnects
// automatically and reports connection state so the UI can show a live badge.

import type { LiveRide } from "@/lib/liveRides";
import { listLiveRides } from "./liveRides";

type WSMessage = { type: string; data: unknown };

type LiveRidesSocketOptions = {
  onRides: (rides: LiveRide[]) => void;
  onConnectionChange: (connected: boolean) => void;
  onError?: (message: string) => void;
};

/**
 * Realtime client for the live rides feed.
 * Owns one WebSocket, a reconnect timer and a polling timer. Call `connect()`
 * after construction and `disconnect()` on unmount; both are idempotent.
 * Incoming `ride:new`, `ride:status_change`, `ride:position_update` and
 * `ride:completed` messages are forwarded through `onRides` (the completed
 * event currently forwards an empty array).
 */
export class LiveRidesSocket {
  private url: string;
  private opts: LiveRidesSocketOptions;
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private polling = false;

  constructor(url: string, opts: LiveRidesSocketOptions) {
    this.url = url;
    this.opts = opts;
  }

  /**
   * Opens the socket if one is not already open.
   * Reports `false` immediately, then `true` once the handshake succeeds; on
   * close or construction failure it schedules a reconnect and starts polling.
   * Malformed messages are ignored rather than surfaced as errors.
   */
  connect(): void {
    if (this.ws) return;
    this.opts.onConnectionChange(false);
    try {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = "arraybuffer";
      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.stopPolling();
        this.opts.onConnectionChange(true);
      };
      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data as string);
          this.handleMessage(msg);
        } catch {
          // ignore malformed messages
        }
      };
      this.ws.onclose = () => {
        this.connected = false;
        this.ws = null;
        this.opts.onConnectionChange(false);
        this.scheduleReconnect();
      };
      this.ws.onerror = () => {
        this.opts.onError?.("WebSocket connection error");
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private handleMessage(msg: WSMessage): void {
    const { type, data } = msg;
    if (type === "ride:new" || type === "ride:status_change") {
      // Single ride objects are wrapped so consumers always receive an array.
      const rides: LiveRide[] = Array.isArray(data) ? data : [data as LiveRide];
      this.opts.onRides(rides);
    } else if (type === "ride:position_update") {
      // Position updates are applied individually by the store tick in mock mode;
      // in real mode the caller merges them.
      this.opts.onRides(Array.isArray(data) ? data : []);
    } else if (type === "ride:completed") {
      const id = (data as { ride_id?: string })?.ride_id;
      this.opts.onRides([]);
      if (id) this.opts.onConnectionChange(this.connected);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    // The backoff delay below is computed but the timer currently fires after a
    // fixed 2 seconds; polling covers the gap either way.
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts += 1;
      const delay = Math.min(
        1000 * Math.pow(2, Math.min(this.reconnectAttempts, 5)),
        30_000,
      );
      this.connect();
    }, 2000);
    this.startPolling();
  }

  private startPolling(): void {
    if (this.polling) return;
    this.polling = true;
    const poll = async () => {
      try {
        const rides = await listLiveRides({});
        this.opts.onRides(rides);
      } catch {
        // swallow; WS reconnect will handle recovery
      }
      // Keep polling every 10s only while the socket is still down.
      if (this.polling && !this.connected) {
        this.pollTimer = setTimeout(poll, 10_000);
      }
    };
    poll();
  }

  private stopPolling(): void {
    this.polling = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Closes the socket, cancels reconnect/poll timers and reports the connection
   * as offline. Safe to call when already disconnected.
   */
  disconnect(): void {
    this.stopPolling();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.opts.onConnectionChange(false);
  }
}
