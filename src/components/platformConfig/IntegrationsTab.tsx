"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Plug,
  XCircle,
} from "lucide-react";

import {
  ConfigCard,
} from "@/components/platformConfig/ConfigPrimitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  API_BASE_URL,
  GOOGLE_MAPS_API_KEY,
  LIVE_RIDES_WS_URL,
  hasGoogleMapsKey,
  isApiConfigured,
} from "@/lib/config";

type IntegrationStatus = "connected" | "configured" | "missing" | "unavailable";

type TestState = "idle" | "pending" | "ok" | "fail";

type Integration = {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  detail: string;
  test?: () => Promise<void>;
};

const STATUS_META: Record<
  IntegrationStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  connected: {
    label: "Connected",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  configured: {
    label: "Configured",
    className: "border-sky-200 bg-sky-50 text-sky-700",
    icon: CheckCircle2,
  },
  missing: {
    label: "Not configured",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: AlertCircle,
  },
  unavailable: {
    label: "Not exposed",
    className: "border-slate-200 bg-slate-50 text-slate-500",
    icon: XCircle,
  },
};

const maskKey = (value: string) =>
  value.length > 4 ? `${"•".repeat(8)}${value.slice(-4)}` : "••••";

const withTimeout = async (run: (signal: AbortSignal) => Promise<void>) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    await run(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

// Any HTTP response (even an error status) proves the backend is reachable.
const testApi = () =>
  withTimeout(async (signal) => {
    const response = await fetch(API_BASE_URL, { method: "GET", signal });
    if (response.status >= 500) throw new Error("Server error");
  });

const testWebSocket = () =>
  withTimeout(
    (signal) =>
      new Promise<void>((resolve, reject) => {
        const socket = new WebSocket(LIVE_RIDES_WS_URL);
        const cleanup = () => {
          signal.removeEventListener("abort", onAbort);
          socket.close();
        };
        const onAbort = () => {
          cleanup();
          reject(new Error("Timed out"));
        };
        signal.addEventListener("abort", onAbort);
        socket.onopen = () => {
          cleanup();
          resolve();
        };
        socket.onerror = () => {
          cleanup();
          reject(new Error("Unreachable"));
        };
      }),
  );

function IntegrationRow({
  integration,
  state,
  onTest,
}: {
  integration: Integration;
  state: TestState;
  onTest: (integration: Integration) => void;
}) {
  const meta = STATUS_META[integration.status];
  const StatusIcon = meta.icon;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800">
            { integration.name }
          </p>
          <span
            className={ `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.className}` }
          >
            <StatusIcon className="size-3" aria-hidden="true" />
            { meta.label }
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          { integration.description }
        </p>
        <p className="mt-1 truncate font-mono text-xs text-slate-400">
          { integration.detail }
        </p>
      </div>

      { integration.test && (
        <div className="flex shrink-0 items-center gap-2">
          { state === "ok" && (
            <Badge variant="outline" className="border-emerald-200 text-emerald-700">
              Reachable
            </Badge>
          ) }
          { state === "fail" && (
            <Badge variant="outline" className="border-rose-200 text-rose-700">
              Failed
            </Badge>
          ) }
          <Button
            type="button"
            variant="outline"
            onClick={ () => onTest(integration) }
            disabled={ state === "pending" }
            className="h-8 border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            { state === "pending" ? (
              <>
                <LoaderCircle className="animate-spin" />
                Testing…
              </>
            ) : (
              "Test connection"
            ) }
          </Button>
        </div>
      ) }
    </div>
  );
}

export function IntegrationsTab() {
  const [states, setStates] = useState<Record<string, TestState>>({});

  const integrations: Integration[] = [
    {
      id: "api",
      name: "API gateway",
      description: "Backend REST API the admin console talks to.",
      status: isApiConfigured ? "connected" : "missing",
      detail: isApiConfigured ? API_BASE_URL : "NEXT_PUBLIC_API_BASE_URL is unset",
      test: isApiConfigured ? testApi : undefined,
    },
    {
      id: "maps",
      name: "Google Maps",
      description: "Map rendering and geocoding on the frontend.",
      status: hasGoogleMapsKey ? "configured" : "missing",
      detail: hasGoogleMapsKey
        ? maskKey(GOOGLE_MAPS_API_KEY)
        : "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is unset",
    },
    {
      id: "live-rides",
      name: "Live rides",
      description: "WebSocket stream powering the live rides board.",
      status: LIVE_RIDES_WS_URL ? "configured" : "missing",
      detail: LIVE_RIDES_WS_URL || "No WebSocket URL configured",
      test: LIVE_RIDES_WS_URL ? testWebSocket : undefined,
    },
    {
      id: "sms",
      name: "SMS gateway",
      description: "Transactional SMS for ride and OTP notifications.",
      status: "unavailable",
      detail: "Credentials are held by the backend only",
    },
    {
      id: "payments",
      name: "Payment gateway",
      description: "Mobile-money and card collection for fares.",
      status: "unavailable",
      detail: "Credentials are held by the backend only",
    },
    {
      id: "push",
      name: "Push notifications",
      description: "Device push for ride status and promotions.",
      status: "unavailable",
      detail: "Credentials are held by the backend only",
    },
    {
      id: "storage",
      name: "Cloud storage",
      description: "Object storage for documents and avatars.",
      status: "unavailable",
      detail: "Credentials are held by the backend only",
    },
  ];

  const handleTest = async (integration: Integration) => {
    if (!integration.test) return;

    setStates((current) => ({ ...current, [integration.id]: "pending" }));

    try {
      await integration.test();
      setStates((current) => ({ ...current, [integration.id]: "ok" }));
    } catch {
      setStates((current) => ({ ...current, [integration.id]: "fail" }));
    }
  };

  return (
    <div className="space-y-5">
      <ConfigCard
        title="Integrations"
        description="Third-party services the platform depends on. Status is derived from the frontend environment."
        action={
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Plug className="size-3.5" aria-hidden="true" />
            Environment
          </span>
        }
      >
        <div className="space-y-3">
          { integrations.map((integration) => (
            <IntegrationRow
              key={ integration.id }
              integration={ integration }
              state={ states[integration.id] ?? "idle" }
              onTest={ handleTest }
            />
          )) }
        </div>
      </ConfigCard>
    </div>
  );
}
