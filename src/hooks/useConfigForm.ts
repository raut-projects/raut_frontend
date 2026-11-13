/**
 * Coordinates configuration form editing and saving.
 * Combines the local draft lifecycle from useConfigDraft with validation and
 * diffing from configRegistry and the bulk update mutation from
 * usePlatformConfig. Collaborates with the toast context for feedback.
 */
import { useToast } from "@/components/toastContext";
import {
  buildConfigDraft,
  draftToUpdates,
  validateConfigDraft,
} from "@/lib/configRegistry";
import type { ConfigRecord } from "@/types/platformConfig";

import { useConfigDraft } from "./useConfigDraft";
import { useUpdateConfigs } from "./usePlatformConfig";

/**
 * Builds a validated save pipeline for platform configuration records.
 *
 * `handleSave` validates the draft, stops at the first field error, converts
 * only changed values with `draftToUpdates`, then calls `useUpdateConfigs`.
 * That mutation reports per-key failures instead of rejecting the whole save:
 * the first failure is attached to its field and the draft stays dirty for
 * correction. A clean response calls `markSaved` and emits the caller's success
 * message. Unexpected errors also leave the draft intact.
 *
 * @param records - Current configuration records used for validation and diffing.
 * @returns The draft API plus `isSaving` and `handleSave`.
 */
export function useConfigForm(records: ConfigRecord[]) {
  const form = useConfigDraft(records, buildConfigDraft);
  const update = useUpdateConfigs();
  const { success, error: toastError } = useToast();

  const handleSave = async (successMessage: string) => {
    if (!form.draft) return;

    const fieldErrors = validateConfigDraft(records, form.draft);
    if (Object.keys(fieldErrors).length) {
      form.setErrors(fieldErrors);
      toastError(
        Object.values(fieldErrors)[0] ?? "Check the highlighted fields.",
      );
      return;
    }

    form.setErrors({});

    const updates = draftToUpdates(records, form.draft);

    // Nothing changed relative to the records, so there is nothing to persist.
    if (!updates.length) return;

    try {
      const failures = await update.mutateAsync(updates);

      if (failures.length) {
        form.setErrors({
          [failures[0].key]: "Could not save this setting.",
        });
        toastError(
          failures[0].error ??
            `${failures.length} setting${failures.length === 1 ? "" : "s"} could not be saved.`,
        );
        return;
      }

      form.markSaved();
      success(successMessage);
    } catch (saveError) {
      toastError(saveError, "Could not save the configuration.");
    }
  };

  return {
    ...form,
    isSaving: update.isPending,
    handleSave,
  };
}
