import { useCallback, useMemo, useState } from "react";

import type { FieldErrors } from "../types/platformConfig";

type DraftUpdate<TDraft> = TDraft | ((current: TDraft) => TDraft);

export function useConfigDraft<TSource, TDraft>(
  source: TSource | undefined,
  toDraft: (source: TSource) => TDraft,
) {
  const initialDraft = useMemo(
    () => (source === undefined ? null : toDraft(source)),
    [source, toDraft],
  );
  const [draftState, setDraftState] = useState<TDraft | null>(null);
  const [baselineState, setBaselineState] = useState<TDraft | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const draft = draftState ?? initialDraft;
  const baseline = baselineState ?? initialDraft;

  const setDraft = useCallback((update: DraftUpdate<TDraft>) => {
    setDraftState((current) => {
      const value = current ?? initialDraft;

      if (value === null) return current;

      return typeof update === "function"
        ? (update as (current: TDraft) => TDraft)(value)
        : update;
    });
  }, [initialDraft]);

  const reset = useCallback(() => {
    setDraftState(baseline);
    setBaselineState(baseline);
    setErrors({});
  }, [baseline]);

  const markSaved = useCallback(() => {
    setDraftState(draft);
    setBaselineState(draft);
    setErrors({});
  }, [draft]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(baseline),
    [draft, baseline],
  );

  return {
    draft,
    setDraft,
    errors,
    setErrors,
    dirty,
    reset,
    markSaved,
  };
}
