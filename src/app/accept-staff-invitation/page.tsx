"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import TanzaniaPhoneInput from "@/components/TanzaniaPhoneInput";
import { useToast } from "@/components/toastContext";
import GateLoader from "@/components/GateLoader";
import { useAcceptStaffInvitation, useVerifyStaffInvitation } from "@/hooks/useStaff";
import {
  getStaffInvitationAcceptErrorMessage,
  getStaffInvitationVerifyErrorMessage,
} from "@/lib/authErrors";
import { safeRedirect } from "@/lib/safeRedirect";
import { useIsClient } from "@/lib/useIsClient";
import {
  toTanzaniaE164Phone,
  validateNewPassword,
  validatePasswordConfirmation,
  validateTanzaniaPhone,
} from "@/lib/validation";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

function readToken() {
  if (typeof window === "undefined") return "";
  return (
    new URLSearchParams(window.location.search).get("token")?.trim() ?? ""
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243"
      />
    </svg>
  ) : (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

type FormErrors = {
  phone?: string;
  currentPassword?: string;
  password?: string;
  confirm?: string;
};

function Shell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-xl -translate-x-1/2 rounded-full bg-brand-100/70 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
            { title }
          </h1>
          <p className="mt-1 text-sm text-slate-500">{ description }</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          { children }
        </div>
      </div>
    </div>
  );
}

function StatusMessage({
  tone,
  message,
}: {
  tone: "error" | "warning";
  message: string;
}) {
  const classes =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <div
      role="alert"
      className={ `mb-5 rounded-lg border p-3 text-sm font-medium ${classes}` }
    >
      { message }
    </div>
  );
}

export default function AcceptStaffInvitationPage() {
  const router = useRouter();
  const toast = useToast();
  const mounted = useIsClient();
  const token = mounted ? readToken() : "";
  const verify = useVerifyStaffInvitation(token);
  const accept = useAcceptStaffInvitation();

  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);

  if (!mounted) {
    return <GateLoader />;
  }

  if (!token) {
    return (
      <Shell
        title="Invitation link required"
        description="Open the invitation link from your email to continue."
      >
        <StatusMessage
          tone="warning"
          message="This invitation link is missing required information."
        />
        <p className="text-center text-sm text-slate-500">
          <Link
            href="/login"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            Back to sign in
          </Link>
        </p>
      </Shell>
    );
  }

  if (verify.isPending) {
    return <GateLoader />;
  }

  if (verify.isError || !verify.data) {
    return (
      <Shell
        title="Invitation could not be verified"
        description="We could not confirm this staff invitation."
      >
        <StatusMessage
          tone="error"
          message={ getStaffInvitationVerifyErrorMessage(verify.error) }
        />
        <p className="text-center text-sm text-slate-500">
          <Link
            href="/login"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            Back to sign in
          </Link>
        </p>
      </Shell>
    );
  }

  const invitation = verify.data;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (accept.isPending || done) return;

    const nextErrors: FormErrors = {};

    if (invitation.requiresPhoneSetup) {
      const phoneError = validateTanzaniaPhone(phone);
      if (phoneError) nextErrors.phone = phoneError;
    }

    if (invitation.requiresCurrentPassword) {
      if (!currentPassword.trim()) {
        nextErrors.currentPassword = "Enter your current password.";
      }
    }

    if (invitation.requiresPasswordSetup) {
      const passwordError = validateNewPassword(password);
      const confirmError = validatePasswordConfirmation(
        password,
        confirmPassword,
      );
      if (passwordError) nextErrors.password = passwordError;
      if (confirmError) nextErrors.confirm = confirmError;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError("");
      return;
    }

    const payload: {
      token: string;
      phone?: string;
      current_password?: string;
      change_password: boolean;
      password?: string;
      password_confirmation?: string;
    } = {
      token,
      change_password: false,
    };

    if (invitation.requiresPhoneSetup) {
      payload.phone = toTanzaniaE164Phone(phone);
    }

    if (invitation.requiresCurrentPassword) {
      payload.current_password = currentPassword;
      payload.change_password = false;
    }

    if (invitation.requiresPasswordSetup) {
      payload.password = password;
      payload.password_confirmation = confirmPassword;
    }

    setErrors({});
    setFormError("");

    try {
      const result = await accept.mutateAsync(payload);
      setDone(true);
      toast.success(result.message || "Invitation accepted. You can sign in now.");
      router.replace(safeRedirect(result.redirectUrl, "/login"));
    } catch (error) {
      setFormError(getStaffInvitationAcceptErrorMessage(error));
    }
  };

  return (
    <Shell
      title="Accept staff invitation"
      description="Review the invitation details and complete your account setup."
    >
      <dl className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Name
          </dt>
          <dd className="mt-0.5 font-medium text-slate-900">
            { invitation.fullName || "Staff member" }
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Email
          </dt>
          <dd className="mt-0.5 font-medium text-slate-900">
            { invitation.email || "Not provided" }
          </dd>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role
            </dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              { invitation.roleName || "Assigned role" }
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Scope
            </dt>
            <dd className="mt-0.5 font-medium capitalize text-slate-900">
              { invitation.scopeType || "Platform" }
            </dd>
          </div>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Invitation expires
          </dt>
          <dd className="mt-0.5 text-slate-700">
            { formatDate(invitation.invitationExpiresAt) }
          </dd>
        </div>
      </dl>

      { formError ? <StatusMessage tone="error" message={ formError } /> : null }

      <form
        onSubmit={ handleSubmit }
        noValidate
        className="space-y-4"
        aria-busy={ accept.isPending }
      >
        { invitation.requiresPhoneSetup ? (
          <div>
            <span className={ labelClass }>Phone number</span>
            <TanzaniaPhoneInput
              value={ phone }
              onChange={ (value) => {
                setPhone(value);
                setErrors((previous) => ({ ...previous, phone: undefined }));
                setFormError("");
              } }
              className={ inputClass }
              disabled={ accept.isPending || done }
            />
            { errors.phone ? (
              <span className={ errorClass }>{ errors.phone }</span>
            ) : null }
          </div>
        ) : null }

        { invitation.requiresCurrentPassword ? (
          <label className="block">
            <span className={ labelClass }>Current password</span>
            <div className="relative">
              <input
                type={ showCurrent ? "text" : "password" }
                autoComplete="current-password"
                value={ currentPassword }
                onChange={ (event) => {
                  setCurrentPassword(event.target.value);
                  setErrors((previous) => ({
                    ...previous,
                    currentPassword: undefined,
                  }));
                  setFormError("");
                } }
                placeholder="Enter your current password"
                className={ `${inputClass} pr-11` }
                disabled={ accept.isPending || done }
                aria-invalid={ Boolean(errors.currentPassword) }
              />
              <button
                type="button"
                onClick={ () => setShowCurrent((value) => !value) }
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
                aria-label={
                  showCurrent ? "Hide current password" : "Show current password"
                }
                disabled={ accept.isPending || done }
              >
                <EyeIcon open={ showCurrent } />
              </button>
            </div>
            { errors.currentPassword ? (
              <span className={ errorClass }>{ errors.currentPassword }</span>
            ) : null }
          </label>
        ) : null }

        { invitation.requiresPasswordSetup ? (
          <>
            <label className="block">
              <span className={ labelClass }>Password</span>
              <div className="relative">
                <input
                  type={ showPassword ? "text" : "password" }
                  autoComplete="new-password"
                  value={ password }
                  onChange={ (event) => {
                    setPassword(event.target.value);
                    setErrors((previous) => ({
                      ...previous,
                      password: undefined,
                    }));
                    setFormError("");
                  } }
                  placeholder="Create a password"
                  className={ `${inputClass} pr-11` }
                  disabled={ accept.isPending || done }
                  aria-invalid={ Boolean(errors.password) }
                />
                <button
                  type="button"
                  onClick={ () => setShowPassword((value) => !value) }
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={ showPassword ? "Hide password" : "Show password" }
                  disabled={ accept.isPending || done }
                >
                  <EyeIcon open={ showPassword } />
                </button>
              </div>
              { errors.password ? (
                <span className={ errorClass }>{ errors.password }</span>
              ) : null }
            </label>

            <label className="block">
              <span className={ labelClass }>Confirm password</span>
              <div className="relative">
                <input
                  type={ showConfirm ? "text" : "password" }
                  autoComplete="new-password"
                  value={ confirmPassword }
                  onChange={ (event) => {
                    setConfirmPassword(event.target.value);
                    setErrors((previous) => ({
                      ...previous,
                      confirm: undefined,
                    }));
                    setFormError("");
                  } }
                  placeholder="Re-enter your password"
                  className={ `${inputClass} pr-11` }
                  disabled={ accept.isPending || done }
                  aria-invalid={ Boolean(errors.confirm) }
                />
                <button
                  type="button"
                  onClick={ () => setShowConfirm((value) => !value) }
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={
                    showConfirm
                      ? "Hide password confirmation"
                      : "Show password confirmation"
                  }
                  disabled={ accept.isPending || done }
                >
                  <EyeIcon open={ showConfirm } />
                </button>
              </div>
              { errors.confirm ? (
                <span className={ errorClass }>{ errors.confirm }</span>
              ) : null }
            </label>
          </>
        ) : null }

        <button
          type="submit"
          disabled={ accept.isPending || done }
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          { accept.isPending ? (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
          ) : null }
          { accept.isPending ? "Accepting…" : "Accept invitation" }
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        <Link
          href="/login"
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Back to sign in
        </Link>
      </p>
    </Shell>
  );
}
