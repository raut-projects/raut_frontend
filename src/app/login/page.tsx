"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toastContext";
import GateLoader from "@/components/GateLoader";
import { useFromParam } from "@/lib/useFromParam";
import { useSession } from "@/hooks/useSession";
import { loginWithEmail } from "@/services/auth";
import { isAdminRole } from "@/lib/roles";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function Login() {
  const router = useRouter();
  const toast = useToast();
  const session = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = useFromParam("/");

  const sessionRedirect = session
    ? isAdminRole(session.role)
      ? from
      : `/request-admin?from=${encodeURIComponent(from === "/request-admin" ? "/" : from)}`
    : null;

  useEffect(() => {
    if (sessionRedirect) router.replace(sessionRedirect);
  }, [sessionRedirect, router]);

  if (session) {
    return <GateLoader />;
  }

  const resetFeedback = () => {
    setErrors({});
    setFormError("");
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setErrors((previous) => ({ ...previous, email: undefined }));
    setFormError("");
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    setErrors((previous) => ({ ...previous, password: undefined }));
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const value = email.trim();
    const nextErrors: { email?: string; password?: string } = {};

    if (!value) {
      nextErrors.email = "Email address is required.";
    } else if (!isValidEmail(value)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    resetFeedback();

    try {
      const signedIn = await loginWithEmail({ email: value, password });
      const admin = isAdminRole(signedIn?.role);
      toast.success("Signed in successfully.");
      router.replace(
        admin
          ? from
          : `/request-admin?from=${encodeURIComponent(from === "/request-admin" ? "/" : from)}`,
      );
    } catch (error) {
      setFormError(
        error?.message ?? "Those credentials are not correct. Please try again.",
      );
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
            Sign in to Raut
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your admin email address and password to open the dashboard.
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

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
            aria-busy={submitting}
          >
            <label className="block">
              <span className={labelClass}>Email address</span>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="admin@raut.africa"
                className={inputClass}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "login-email-error" : undefined}
              />
              {errors.email && (
                <span id="login-email-error" className={errorClass}>
                  {errors.email}
                </span>
              )}
            </label>

            <label className="block">
              <span className={labelClass}>Password</span>
              <div className="relative">
                <input
                  id="login-password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  className={`${inputClass} pr-11`}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "login-password-error" : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setVisible((previous) => !previous)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  aria-label={
                    visible ? "Hide the password" : "Show the password"
                  }
                >
                  {visible ? (
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
                  )}
                </button>
              </div>
              {errors.password && (
                <span id="login-password-error" className={errorClass}>
                  {errors.password}
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
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Need access? Contact{" "}
          <a
            href="mailto:support@raut.africa"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            support@raut.africa
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
