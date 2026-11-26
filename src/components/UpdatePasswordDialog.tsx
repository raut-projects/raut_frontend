"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "./toastContext";
import SidePanel from "./SidePanel";
import {
  validateNewPassword,
  validatePasswordConfirmation,
} from "../lib/validation";
import { signOut, updatePassword } from "../services/auth";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

type FormErrors = {
  password?: string;
  confirm?: string;
};

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  visible: boolean;
  disabled: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
};

function PasswordField({
  id,
  label,
  value,
  placeholder,
  error,
  visible,
  disabled,
  inputRef,
  onChange,
  onToggleVisibility,
}: PasswordFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          maxLength={128}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error ? (
        <span id={errorId} className={errorClass}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export default function UpdatePasswordDialog({ open, onClose }) {
  const router = useRouter();
  const toast = useToast();
  const formId = `update-password-form-${useId()}`;
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) passwordInputRef.current?.focus();
  }, [open]);

  const handleClose = () => {
    if (submitting) return;

    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
    setErrors({});
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors: FormErrors = {};
    const passwordError = validateNewPassword(password);
    const confirmError = validatePasswordConfirmation(password, confirmPassword);

    if (passwordError) nextErrors.password = passwordError;
    if (confirmError) nextErrors.confirm = confirmError;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    try {
      await updatePassword(password);

      onClose();
      signOut();
      router.replace("/login");
      toast.success("Password updated. Sign in with your new password.");
    } catch (error) {
      toast.error(error, "We couldn't update your password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidePanel
      open={open}
      onClose={handleClose}
      title="Update password"
      description="Choose a new password. You'll be signed out once it's saved."
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {submitting ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
            ) : null}
            {submitting ? "Updating…" : "Update password"}
          </button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit}
        noValidate
        aria-busy={submitting}
        className="space-y-4"
      >
        <PasswordField
          id="update-password-new"
          label="New password"
          value={password}
          placeholder="Enter your new password"
          error={errors.password}
          visible={showPassword}
          disabled={submitting}
          inputRef={passwordInputRef}
          onChange={(value) => {
            setPassword(value);
            setErrors((previous) => ({ ...previous, password: undefined }));
          }}
          onToggleVisibility={() => setShowPassword((value) => !value)}
        />
        <PasswordField
          id="update-password-confirm"
          label="Confirm new password"
          value={confirmPassword}
          placeholder="Re-enter your new password"
          error={errors.confirm}
          visible={showConfirm}
          disabled={submitting}
          onChange={(value) => {
            setConfirmPassword(value);
            setErrors((previous) => ({ ...previous, confirm: undefined }));
          }}
          onToggleVisibility={() => setShowConfirm((value) => !value)}
        />
      </form>
    </SidePanel>
  );
}
