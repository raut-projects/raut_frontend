import { useId, useState } from "react";
import SidePanel from "./SidePanel";

const reasons = [
  "Photo unclear/blurry",
  "Information not visible",
  "Document expired",
  "Information mismatch",
  "Suspected fraud",
  "Other",
];

type DocumentRejectionDialogProps = {
  open: boolean;
  onClose: () => void;
  description?: string;
  pending?: boolean;
  onConfirm: (reason: string) => Promise<unknown> | unknown;
};

export default function DocumentRejectionDialog({
  open,
  onClose,
  description,
  pending = false,
  onConfirm,
}: DocumentRejectionDialogProps) {
  const reasonGroupId = useId();
  const formId = useId();
  const [selectedReason, setSelectedReason] = useState("Other");
  const [details, setDetails] = useState("");
  const [sendSms, setSendSms] = useState(true);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const trimmedDetails = details.trim();
  const detailsInvalid =
    selectedReason === "Other" &&
    (trimmedDetails.length < 5 || trimmedDetails.length > 500);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    if (detailsInvalid) {
      setAttemptedSubmit(true);
      return;
    }

    const reason =
      selectedReason === "Other"
        ? `Other: ${trimmedDetails}`
        : selectedReason;
    void Promise.resolve()
      .then(() => onConfirm(reason))
      .catch(() => {});
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Reject document"
      description={description}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            {pending && (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-90"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {pending ? "Working…" : "Confirm Rejection"}
          </button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5"
      >
        <fieldset disabled={pending} className="space-y-3">
          <legend className="mb-2 text-xs font-semibold text-slate-600">
            Reason:
          </legend>
          {reasons.map((reason) => (
            <label
              key={reason}
              className="flex cursor-pointer items-center gap-3 text-sm text-slate-700"
            >
              <input
                type="radio"
                name={reasonGroupId}
                value={reason}
                checked={selectedReason === reason}
                onChange={() => {
                  setSelectedReason(reason);
                  setAttemptedSubmit(false);
                }}
                className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {reason === "Other" ? "Other (specify below)" : reason}
            </label>
          ))}
        </fieldset>

        {selectedReason === "Other" && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Details:
            </span>
            <textarea
              value={details}
              onChange={(event) => {
                setDetails(event.target.value);
                setAttemptedSubmit(false);
              }}
              rows={2}
              maxLength={500}
              disabled={pending}
              aria-invalid={attemptedSubmit && detailsInvalid}
              aria-describedby={
                attemptedSubmit && detailsInvalid
                  ? `${reasonGroupId}-error`
                  : undefined
              }
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"
            />
            {attemptedSubmit && detailsInvalid ? (
              <span
                id={`${reasonGroupId}-error`}
                role="alert"
                className="mt-1 block text-xs font-medium text-rose-600"
              >
                Add at least 5 characters to explain this rejection.
              </span>
            ) : (
              <span className="mt-1 block text-xs text-slate-500">
                5–500 characters.
              </span>
            )}
          </label>
        )}

        <div>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={sendSms}
              onChange={(event) => setSendSms(event.target.checked)}
              disabled={pending}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Send SMS to driver
          </label>
          <p className="ml-7 mt-1 text-xs text-slate-500">
            SMS delivery is not connected yet; this option will not send a
            message.
          </p>
        </div>
      </form>
    </SidePanel>
  );
}
