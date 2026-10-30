import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../components/toastContext";
import { useSession } from "../hooks/useSession";
import { isValidPhone, requestOtp, verifyOtp } from "../services/auth";
import { OTP_CODE_LENGTH } from "../lib/config";
import { isAdminRole } from "../lib/roles";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
};

const isExpiredMessage = (message) =>
  /expired|no longer valid|invalid or has expired/i.test(message ?? "");

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const session = useSession();

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<{ phone?: string; code?: string }>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(0);

  const from = location.state?.from ?? "/";

  useEffect(() => {
    if (step !== "code" || remaining <= 0) return undefined;

    const timer = setTimeout(() => {
      setRemaining((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [step, remaining]);

  if (session) {
    return (
      <Navigate
        to={isAdminRole(session.role) ? from : "/request-admin"}
        replace
      />
    );
  }

  const resetFeedback = () => {
    setErrors({});
    setFormError("");
  };

  const handlePhoneChange = (event) => {
    setPhone(event.target.value);
    setErrors((previous) => ({ ...previous, phone: undefined }));
    setFormError("");
  };

  const handleCodeChange = (event) => {
    setCode(event.target.value.replace(/\D/g, "").slice(0, OTP_CODE_LENGTH));
    setErrors((previous) => ({ ...previous, code: undefined }));
    setFormError("");
  };

  const handleSendCode = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const value = phone.trim();

    if (!value) {
      setErrors({ phone: "Phone number is required." });
      return;
    }

    if (!isValidPhone(value)) {
      setErrors({
        phone:
          "Enter a valid phone number, e.g. +255 600 000 000/+255 700 000 000.",
      });
      return;
    }

    setSubmitting(true);
    resetFeedback();

    try {
      const result = await requestOtp(value);

      setPhone(result.phone ?? value);
      setCode("");
      setRemaining(result.expiresInSeconds);
      setStep("code");
      toast.success(result.message);
    } catch (error) {
      setFormError(
        error?.message ??
          "We could not send a verification code. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (submitting || remaining > 0) return;

    setSubmitting(true);
    resetFeedback();

    try {
      const result = await requestOtp(phone);

      setCode("");
      setRemaining(result.expiresInSeconds);
      toast.success(result.message);
    } catch (error) {
      setFormError(
        error?.message ?? "We could not send a new code. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const value = code.trim();

    if (!value) {
      setErrors({ code: "Enter the verification code." });
      return;
    }

    if (value.length !== OTP_CODE_LENGTH) {
      setErrors({
        code: `The verification code is ${OTP_CODE_LENGTH} digits.`,
      });
      return;
    }

    setSubmitting(true);
    resetFeedback();

    try {
      const signedIn = await verifyOtp({ phone, code: value });
      const admin = isAdminRole(signedIn?.role);
      toast.success("Signed in successfully.");
      navigate(admin ? from : "/request-admin", {
        replace: true,
        state: admin
          ? undefined
          : { from: from === "/request-admin" ? "/" : from },
      });
    } catch (error) {
      setFormError(
        error?.message ?? "The code is not correct. Please try again.",
      );
      if (isExpiredMessage(error?.message)) setRemaining(0);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeNumber = () => {
    setStep("phone");
    setCode("");
    setRemaining(0);
    resetFeedback();
  };

  const expired = step === "code" && remaining <= 0;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-xl -translate-x-1/2 rounded-full bg-brand-100/70 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
            {step === "phone" ? "Sign in to Raut" : "Enter your code"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === "phone"
              ? "Enter your admin phone number and we will send you a verification code."
              : `We sent a ${OTP_CODE_LENGTH}-digit code to ${phone}.`}
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

          {step === "phone" ? (
            <form
              onSubmit={handleSendCode}
              noValidate
              className="space-y-4"
              aria-busy={submitting}
            >
              <label className="block">
                <span className={labelClass}>Phone number</span>
                <input
                  id="login-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+255 000 000 000"
                  className={inputClass}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={
                    errors.phone ? "login-phone-error" : undefined
                  }
                />
                {errors.phone && (
                  <span id="login-phone-error" className={errorClass}>
                    {errors.phone}
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
                {submitting ? "Sending…" : "Send code"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleVerify}
              noValidate
              className="space-y-4"
              aria-busy={submitting}
            >
              <label className="block">
                <span className={labelClass}>Verification code</span>
                <input
                  id="login-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={OTP_CODE_LENGTH}
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  className={`${inputClass} text-center text-lg font-semibold tracking-[0.4em] placeholder:tracking-[0.4em] placeholder:text-slate-300`}
                  aria-invalid={Boolean(errors.code)}
                  aria-describedby={
                    errors.code ? "login-code-error" : "login-code-hint"
                  }
                />
                {errors.code ? (
                  <span id="login-code-error" className={errorClass}>
                    {errors.code}
                  </span>
                ) : (
                  <span
                    id="login-code-hint"
                    className="mt-1 block text-xs text-slate-500"
                  >
                    {expired ? (
                      <span className="font-medium text-amber-600">
                        That code has expired. Request a new one below.
                      </span>
                    ) : (
                      `Code expires in ${formatCountdown(remaining)}`
                    )}
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
                {submitting ? "Verifying…" : "Verify and sign in"}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleChangeNumber}
                  disabled={submitting}
                  className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-60"
                >
                  Change number
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={submitting || remaining > 0}
                  className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:text-slate-400"
                >
                  {remaining > 0
                    ? `Resend code in ${formatCountdown(remaining)}`
                    : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Need access? Contact{" "}
          <a
            href="mailto:support@raut.co.tz"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            support@raut.co.tz
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
