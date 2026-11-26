import { getDashboardStats } from "./dashboardOps";

export type DashboardRealtimeEventType =
  | "stats:update"
  | "ride:completed"
  | "driver:status_change"
  | "alert:new"
  | "position:update";

export interface DashboardRealtimeMessage {
  type: DashboardRealtimeEventType;
  data: unknown;
}

export type DashboardSocketHandlers = {
  onMessage: (message: DashboardRealtimeMessage) => void;
  onConnectionChange: (connected: boolean) => void;
  onError?: (message: string) => void;
};

const FORWARDED_EVENTS: DashboardRealtimeEventType[] = [
  "stats:update",
  "ride:completed",
  "driver:status_change",
  "alert:new",
  "position:update",
];

const POLL_INTERVAL_MS = 30_000;
const MAX_BACKOFF_MS = 30_000;
const MAX_BACKOFF_EXPONENT = 5;

export class DashboardSocket {
  private url: string;
  private handlers: DashboardSocketHandlers;
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private polling = false;
  private manuallyClosed = false;

  constructor(url: string, handlers: DashboardSocketHandlers) {
    this.url = url;
    this.handlers = handlers;
  }

  connect(): void {
    if (this.ws) return;
    this.manuallyClosed = false;
    this.handlers.onConnectionChange(false);
    try {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = "arraybuffer";
      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.stopPolling();
        this.handlers.onConnectionChange(true);
      };
      this.ws.onmessage = (event) => {
        try {
          const parsed: unknown = JSON.parse(event.data as string);
          if (!parsed || typeof parsed !== "object") return;
          const message = parsed as DashboardRealtimeMessage;
          if (typeof message.type !== "string") return;
          if (!FORWARDED_EVENTS.includes(message.type)) return;
          this.handlers.onMessage(message);
        } catch {
          return;
        }
      };
      this.ws.onclose = () => {
        this.connected = false;
        this.ws = null;
        this.handlers.onConnectionChange(false);
        if (!this.manuallyClosed) this.scheduleReconnect();
      };
      this.ws.onerror = () => {
        this.handlers.onError?.("Dashboard WebSocket connection error");
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.manuallyClosed || this.reconnectTimer) return;
    const delay = Math.min(
      1000 * 2 ** Math.min(this.reconnectAttempts, MAX_BACKOFF_EXPONENT),
      MAX_BACKOFF_MS,
    );
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
    this.startPolling();
  }

  private startPolling(): void {
    if (this.polling) return;
    this.polling = true;
    const poll = async () => {
      if (this.connected || this.manuallyClosed) return;
      try {
        const stats = await getDashboardStats();
        if (this.connected || this.manuallyClosed) return;
        this.handlers.onMessage({ type: "stats:update", data: stats });
      } catch {
        return;
      }
    };
    void poll();
    this.pollTimer = setInterval(poll, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    this.polling = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  disconnect(): void {
    this.manuallyClosed = true;
    this.stopPolling();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.handlers.onConnectionChange(false);
  }
}
