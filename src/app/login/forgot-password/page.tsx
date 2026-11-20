"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toastContext";
import GateLoader from "@/components/GateLoader";
import { useAuthHydrated, useSession } from "@/hooks/useSession";
import { usePermissions } from "@/hooks/usePermissions";
import { useFromParam } from "@/lib/useFromParam";
import { resolvePostLoginRoute } from "@/lib/navigation";
import { validateEmail } from "@/lib/validation";
import { getPasswordResetErrorMessage } from "@/lib/authErrors";
import { resetPassword } from "@/services/auth";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

function ForgotPassword() {
  const router = useRouter();
  const toast = useToast();
  const session = useSession();
  const hydrated = useAuthHydrated();
  const { access, hydrated: permissionHydrated } = usePermissions();
  const from = useFromParam("/");

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sessionRedirect =
    session && permissionHydrated
      ? resolvePostLoginRoute(access, from) ?? "/"
      : null;

  useEffect(() => {
    if (sessionRedirect) router.replace(sessionRedirect);
  }, [sessionRedirect, router]);

  if (!hydrated || !permissionHydrated || session) {
    return <GateLoader />;
  }

  const loginHref =
    from && from !== "/"
      ? `/login?from=${encodeURIComponent(from)}`
      : "/login";

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setError("");
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const value = email.trim();
    const emailError = validateEmail(value);
    if (emailError) {
      setError(emailError);
      return;
    }

    setSubmitting(true);
    setError("");
    setFormError("");

    try {
      await resetPassword(value);
      const message =
        "If that email is registered, we've sent a password reset link.";
      setSentTo(value);
      setFormError("");
      toast.success(message);
    } catch (submitError) {
      setFormError(getPasswordResetErrorMessage(submitError));
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
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the email address for your account and we&apos;ll send a reset
            link.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
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

          {sentTo && !formError && (
            <div
              role="status"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3"
            >
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm font-medium text-emerald-800">
                <p>
                  If <span className="font-semibold">{sentTo}</span> is
                  registered, we&apos;ve sent a password reset link.
                </p>
                <p className="mt-1 text-xs font-normal text-emerald-700">
                  Open the link in your email to set a new password, then return
                  here to sign in.
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
            aria-busy={submitting}
          >
            <label className="block">
              <span className={labelClass}>Email address</span>
              <input
                id="forgot-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={handleEmailChange}
                placeholder="admin@raut.africa"
                className={inputClass}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "forgot-email-error" : undefined}
              />
              {error && (
                <span id="forgot-email-error" className={errorClass}>
                  {error}
                </span>
              )}
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting && (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
              )}
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            <Link
              href={loginHref}
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

export default ForgotPassword;