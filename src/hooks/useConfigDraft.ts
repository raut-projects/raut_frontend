/**
 * Local draft state for platform configuration forms.
 * Tracks edits separately from the server-derived baseline so screens can
 * detect unsaved changes, reset, or acknowledge a successful save. Used by
 * useConfigForm and backed by the platformConfig FieldErrors type.
 */
import { useCallback, useMemo, useState } from "react";

import type { FieldErrors } from "../types/platformConfig";

type DraftUpdate<TDraft> = TDraft | ((current: TDraft) => TDraft);

/**
 * Manages an editable draft derived from a server source record.
 *
 * The initial draft and baseline are memoized from `source`, and both state
 * slots stay `null` until the first edit or lifecycle call. That means `draft`
 * and `baseline` transparently follow fresh source data before the user edits,
 * then diverge. `dirty` is a JSON comparison of the draft against the baseline,
 * so nested changes are detected without a deep-equality dependency.
 * `reset` restores the baseline and clears errors; `markSaved` promotes the
 * current draft to the new baseline and clears errors.
 *
 * @param source - Server record used to build the draft; undefined while loading.
 * @param toDraft - Converts the source record into the editable shape.
 * @returns Draft, setter, validation errors, dirty flag, reset and markSaved.
 */
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

  // Null state means the draft still follows the latest source-derived value.
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
