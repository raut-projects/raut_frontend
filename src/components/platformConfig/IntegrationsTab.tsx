"use client";

import { useState } from "react";
import { ExternalLink, LoaderCircle, PlugZap } from "lucide-react";
import { cn } from "cn";

import {
  ConfigCard,
  ConfigSkeleton,
} from "@/components/platformConfig/ConfigPrimitives";
import { QueryError } from "@/components/queryStates";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import { useIntegrations, useTestIntegration } from "@/hooks/usePlatformConfig";
import { maskIdentifier } from "@/lib/platformConfig";
import { INTEGRATION_STATUS_LABELS } from "@/services/mappers";
import type {
  Integration,
  IntegrationStatusKey,
  IntegrationTestResult,
} from "@/types/platformConfig";

const STATUS_STYLES: Record<IntegrationStatusKey, string> = {
  connected: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  degraded: "bg-amber-50 text-amber-700 ring-amber-600/20",
  disconnected: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

function StatusBadge({ status }: { status: IntegrationStatusKey }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        STATUS_STYLES[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {INTEGRATION_STATUS_LABELS[status]}
    </span>
  );
}

export function IntegrationsTab() {
  const query = useIntegrations();
  const test = useTestIntegration();
  const { success, error: toastError } = useToast();
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [results, setResults] = useState<
    Record<string, IntegrationTestResult>
  >({});

  const handleTest = async (integration: Integration) => {
    setTestingKey(integration.key);

    try {
      const result = await test.mutateAsync(integration.key);

      setResults((current) => ({ ...current, [integration.key]: result }));

      if (result.status === "connected") {
        success(`${integration.name} connection succeeded.`);
      } else if (result.status === "degraded") {
        toastError(
          result.message || `${integration.name} is reachable but degraded.`,
        );
      } else {
        toastError(result.message || `${integration.name} connection failed.`);
      }
    } catch (testError) {
      toastError(
        testError?.message ?? `Could not test ${integration.name}.`,
      );
    } finally {
      setTestingKey(null);
    }
  };

  if (query.isPending) {
    return (
      <ConfigCard title="Integrations" description="Loading integrations…">
        <ConfigSkeleton fields={3} />
      </ConfigCard>
    );
  }

  if (query.isError) {
    return (
      <ConfigCard title="Integrations">
        <QueryError error={query.error} onRetry={query.refetch} />
      </ConfigCard>
    );
  }

  const integrations = query.data ?? [];

  return (
    <ConfigCard
      title="Integrations"
      description="Third-party services connected to RAUT. Test a connection to confirm it is healthy."
      footer={
        <p className="text-xs text-slate-500">
          Credentials are managed on the backend. Running a test does not change
          the integration status.
        </p>
      }
    >
      {integrations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            No integrations configured
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Connected services will appear here once they are set up.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {integrations.map((integration) => {
            const result = results[integration.key];
            const isTesting = testingKey === integration.key;

            return (
              <div
                key={integration.key}
                className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold uppercase text-slate-600">
                    {integration.name.slice(0, 2)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {integration.name}
                      </p>
                      <StatusBadge status={integration.status} />
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {integration.identifier_label}:{" "}
                      <span className="font-medium text-slate-700">
                        {maskIdentifier(integration.identifier)}
                      </span>
                    </p>

                    {integration.docs_url && (
                      <a
                        href={integration.docs_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        View docs
                        <ExternalLink className="size-3" />
                      </a>
                    )}

                    {result && (
                      <div
                        className={cn(
                          "mt-2 rounded-lg px-3 py-2 text-xs font-medium",
                          result.status === "connected"
                            ? "bg-emerald-50 text-emerald-700"
                            : result.status === "degraded"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700",
                        )}
                      >
                        {result.message}
                        {typeof result.latency_ms === "number" &&
                          Number.isFinite(result.latency_ms) &&
                          ` · ${Math.round(result.latency_ms)} ms`}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleTest(integration)}
                  disabled={isTesting}
                  className="h-9 shrink-0 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {isTesting ? (
                    <>
                      <LoaderCircle className="animate-spin" />
                      Testing…
                    </>
                  ) : (
                    <>
                      <PlugZap />
                      Test connection
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </ConfigCard>
  );
}
