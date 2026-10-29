import { useId, useState } from 'react'
import SidePanel from './SidePanel.jsx'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'

const errorClass = 'mt-1 block text-xs font-medium text-rose-600'

// Each dialog needs its own form id, the submit button lives outside the form.
// The id has to be unique per instance, otherwise the button of one dialog
// submits the other dialog that happens to be mounted first.
const useFormId = () => `admin-form-${useId()}`

function PanelActions({ onClose, confirmLabel, pending, tone = 'brand', formId }) {
  return (
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
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 ${
          tone === 'danger'
            ? 'bg-rose-600 hover:bg-rose-700 focus-visible:outline-rose-600'
            : 'bg-brand-600 hover:bg-brand-700 focus-visible:outline-brand-600'
        }`}
      >
        {pending && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {pending ? 'Working…' : confirmLabel}
      </button>
    </>
  )
}

// Collects the reason the API expects for reject, suspend, deactivate and
// cancel requests. The text is owned by the caller so it can be cleared when
// the panel closes.
export function ReasonDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  label = 'Reason',
  minLength = 5,
  maxLength = 500,
  optional = false,
  placeholder = 'Explain the decision…',
  value,
  onChange,
  onConfirm,
  pending = false,
  tone,
  children,
}) {
  const [touched, setTouched] = useState(false)
  const formId = useFormId()

  const trimmed = String(value ?? '').trim()
  const tooShort = !optional && trimmed.length < minLength
  const tooLong = trimmed.length > maxLength
  const invalid = tooShort || tooLong

  const handleChange = (next) => {
    setTouched(false)
    onChange(next)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (pending) return

    if (invalid) {
      setTouched(true)
      return
    }

    // The caller reports failures through a toast, the panel stays open so the
    // request can be retried.
    Promise.resolve(onConfirm(trimmed)).catch(() => {})
  }

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <PanelActions
          onClose={onClose}
          confirmLabel={confirmLabel}
          pending={pending}
          tone={tone ?? (confirmLabel.toLowerCase().includes('cancel') ? 'danger' : 'brand')}
          formId={formId}
        />
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <label className="block">
          <span className={labelClass}>{label}</span>
          <textarea
            value={value}
            onChange={(event) => handleChange(event.target.value)}
            placeholder={placeholder}
            rows={4}
            className={inputClass}
            aria-invalid={Boolean(touched && invalid)}
          />
          {touched && tooShort && (
            <span className={errorClass}>
              Give at least {minLength} characters so the decision is traceable.
            </span>
          )}
          {tooLong && <span className={errorClass}>Keep the reason under {maxLength} characters.</span>}
          {!touched && !tooShort && !tooLong && (
            <span className="mt-1 block text-xs text-slate-400">
              {optional ? 'Optional.' : `${minLength}–${maxLength} characters.`}
            </span>
          )}
        </label>
        {children}
      </form>
    </SidePanel>
  )
}

const ROLES = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super admin' },
]

// A plain confirmation for actions that do not collect a reason, such as
// retrying a failed payout.
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'brand',
  children,
  onConfirm,
  pending = false,
}) {
  const formId = useFormId()

  const handleSubmit = (event) => {
    event.preventDefault()
    if (pending) return

    Promise.resolve(onConfirm()).catch(() => {})
  }

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <PanelActions
          onClose={onClose}
          confirmLabel={confirmLabel}
          pending={pending}
          tone={tone}
          formId={formId}
        />
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        {children}
      </form>
    </SidePanel>
  )
}

export function RoleDialog({ open, onClose, value, onChange, onConfirm, pending = false }) {
  const formId = useFormId()

  const handleSubmit = (event) => {
    event.preventDefault()
    if (pending) return

    Promise.resolve(onConfirm(value)).catch(() => {})
  }

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Change role"
      description="Set the access level for this account."
      footer={
        <PanelActions onClose={onClose} confirmLabel="Update role" pending={pending} formId={formId} />
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <label className="block">
          <span className={labelClass}>Role</span>
          <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
            {ROLES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </form>
    </SidePanel>
  )
}
