"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toastContext";
import GateLoader from "@/components/GateLoader";
import { useAuthHydrated, useSession } from "@/hooks/useSession";
import { usePermissions } from "@/hooks/usePermissions";
import { resolvePostLoginRoute } from "@/lib/navigation";
import { useIsClient } from "@/lib/useIsClient";
import { getPasswordUpdateErrorMessage } from "@/lib/authErrors";
import {
  validateNewPassword,
  validatePasswordConfirmation,
} from "@/lib/validation";
import { confirmResetPassword } from "@/services/auth"

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

function readResetParams() {
  if (typeof window === "undefined") {
    return { token: "", code: "", email: "" };
  }

  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const read = (keys: string[]) => {
    for (const key of keys) {
      const value = params.get(key) ?? hashParams.get(key);
      if (value) return value;
    }
    return "";
  };

  return {
    token: read(["token", "reset_token", "access_token", "t", "oobCode"]),
    code: read(["code", "otp"]),
    email: read(["email"]),
  };
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

function ResetPassword() {
  const router = useRouter();
  const toast = useToast();
  const session = useSession();
  const hydrated = useAuthHydrated();
  const { access, hydrated: permissionHydrated } = usePermissions();
  const mounted = useIsClient();

  const params = mounted
    ? readResetParams()
    : { token: "", code: "", email: "" };
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>(
    {},
  );
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const sessionRedirect =
    session && permissionHydrated
      ? resolvePostLoginRoute(access, "/") ?? "/"
      : null;

  useEffect(() => {
    if (sessionRedirect) router.replace(sessionRedirect);
  }, [sessionRedirect, router]);

  const hasCredential = Boolean(params.token || params.code);

  if (!hydrated || !permissionHydrated || session || !mounted) {
    return <GateLoader />;
  }

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    setErrors((previous) => ({ ...previous, password: undefined }));
    setFormError("");
  };

  const handleConfirmChange = (event) => {
    setConfirmPassword(event.target.value);
    setErrors((previous) => ({ ...previous, confirm: undefined }));
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || done) return;

    if (!hasCredential) {
      setFormError(
        "This reset link is missing required information. Request a new one to continue.",
      );
      return;
    }

    const nextErrors: { password?: string; confirm?: string } = {};
    const passwordError = validateNewPassword(password);
    const confirmError = validatePasswordConfirmation(password, confirmPassword);
    if (passwordError) nextErrors.password = passwordError;
    if (confirmError) nextErrors.confirm = confirmError;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    setFormError("");

    try {
      await confirmResetPassword({
        token: params.token || undefined,
        password,
      });
      setDone(true);
      toast.success("Your password has been updated. You can sign in now.");
      router.replace("/login");
    } catch (submitError) {
      setFormError(getPasswordUpdateErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-xl -translate-x-1/2 rounded-full bg-brand-100/70 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
            Create a new password
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose a new password for your account, then sign in again.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          {!hasCredential && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800"
            >
              This reset link is invalid or incomplete. Please request a new
              password reset link.
            </div>
          )}

          {formError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3"
            >
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <p className="text-sm font-medium text-rose-700">{formError}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
            aria-busy={submitting}
          >
            <label className="block">
              <span className={labelClass}>New password</span>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter a new password"
                  className={`${inputClass} pr-11`}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "reset-password-error" : undefined
                  }
                  disabled={!hasCredential || done}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={!hasCredential || done}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {errors.password && (
                <span id="reset-password-error" className={errorClass}>
                  {errors.password}
                </span>
              )}
            </label>

            <label className="block">
              <span className={labelClass}>Confirm new password</span>
              <div className="relative">
                <input
                  id="reset-password-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={handleConfirmChange}
                  placeholder="Re-enter your new password"
                  className={`${inputClass} pr-11`}
                  aria-invalid={Boolean(errors.confirm)}
                  aria-describedby={
                    errors.confirm ? "reset-password-confirm-error" : undefined
                  }
                  disabled={!hasCredential || done}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((value) => !value)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  aria-label={
                    showConfirm ? "Hide password confirmation" : "Show password confirmation"
                  }
                  disabled={!hasCredential || done}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {errors.confirm && (
                <span id="reset-password-confirm-error" className={errorClass}>
                  {errors.confirm}
                </span>
              )}
            </label>

            <button
              type="submit"
              disabled={submitting || !hasCredential || done}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting && (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
              )}
              {submitting ? "Updating…" : "Update password"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            <Link
              href="/login/forgot-password"
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Request a new reset link
            </Link>
            <span className="mx-2 text-slate-300">|</span>
            <Link
              href="/login"
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;