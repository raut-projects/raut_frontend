import { useToast } from "@/components/toastContext";
import {
  buildConfigDraft,
  draftToUpdates,
  validateConfigDraft,
} from "@/lib/configRegistry";
import type { ConfigRecord } from "@/types/platformConfig";

import { useConfigDraft } from "./useConfigDraft";
import { useUpdateConfigs } from "./usePlatformConfig";

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
