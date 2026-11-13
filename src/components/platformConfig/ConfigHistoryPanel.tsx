"use client";

import { History } from "lucide-react";

import { ConfigSkeleton } from "@/components/platformConfig/ConfigPrimitives";
import { QueryError } from "@/components/queryStates";
import SidePanel from "@/components/SidePanel";
import { useConfigHistory } from "@/hooks/usePlatformConfig";
import { fieldSpecFor, formatConfigValue } from "@/lib/configRegistry";
import { formatDateTime, formatRelative } from "@/services/mappers";
import type { ConfigRecord } from "@/types/platformConfig";

export function ConfigHistoryPanel({
  record,
  open,
  onClose,
}: {
  record: ConfigRecord | null;
  open: boolean;
  onClose: () => void;
}) {
  const query = useConfigHistory(open ? (record?.key ?? null) : null, 50);
  const spec = record ? fieldSpecFor(record) : null;

  return (
    <SidePanel
      open={ open }
      onClose={ onClose }
      title="Change history"
      description={ record?.key }
    >
      { query.isPending && <ConfigSkeleton fields={ 3 } /> }

      { query.isError && (
        <QueryError error={ query.error } onRetry={ query.refetch } />
      ) }

      { query.isSuccess && !query.data?.length && (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <History
            className="size-6 text-slate-400"
            strokeWidth={ 1.8 }
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-slate-700">
            No changes recorded yet
          </p>
          <p className="max-w-xs text-xs text-slate-500">
            Every saved update to this setting will appear here with its
            version and author.
          </p>
        </div>
      ) }

      { Boolean(query.data?.length) && (
        <ol className="space-y-3">
          { query.data?.map((entry) => {
            const values = Object.entries(entry.value ?? {});

            return (
              <li
                key={ entry.id || `${entry.version}-${entry.changedAt}` }
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Version { entry.version || "—" }
                  </span>
                  <span className="text-xs text-slate-500">
                    { formatRelative(entry.changedAt) }
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  { formatDateTime(entry.changedAt) }
                  { entry.changedBy ? ` · ${entry.changedBy}` : "" }
                </p>

                <div className="mt-2 space-y-1">
                  { values.length ? (
                    values.map(([key, value]) => (
                      <div
                        key={ key }
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="text-slate-500">{ key }</span>
                        <span className="font-medium text-slate-800">
                          { spec
                            ? formatConfigValue(
                              value as string | number | boolean,
                              spec,
                            )
                            : String(value) }
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">
                      No value recorded.
                    </p>
                  ) }
                </div>

                { entry.notes && (
                  <p className="mt-2 rounded bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
                    { entry.notes }
                  </p>
                ) }
              </li>
            );
          }) }
        </ol>
      ) }
    </SidePanel>
  );
}
