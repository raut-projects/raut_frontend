import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getSession, isValidPhone, signIn } from '../services/auth.js'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'
const errorClass = 'mt-1 block text-xs font-medium text-rose-600'

const initialForm = { phone: '', code: '' }

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showCode, setShowCode] = useState(false)

  const session = getSession()
  if (session) return <Navigate to="/" replace />

  const from = location.state?.from ?? '/'

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setFormError('')
  }

  const validate = () => {
    const next = {}
    if (!form.phone.trim()) next.phone = 'Phone number is required.'
    else if (!isValidPhone(form.phone)) next.phone = 'Enter a valid phone number, e.g. +255 754 555 0132.'
    if (!form.code.trim()) next.code = 'Secret code is required.'
    else if (form.code.trim().length < 4) next.code = 'Secret code must be at least 4 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!validate()) return

    setSubmitting(true)
    setFormError('')

    const result = await signIn({ phone: form.phone, code: form.code })

    if (!result.ok) {
      setFormError(result.error)
      setSubmitting(false)
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-xl -translate-x-1/2 rounded-full bg-brand-100/70 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">Sign in to Raut</h1>
          <p className="mt-1 text-sm text-slate-500">
            Use your admin phone number and secret code.
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

          <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-busy={submitting}>
            <label className="block">
              <span className={labelClass}>Phone number</span>
              <input
                id="login-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+255 754 555 0132"
                className={inputClass}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'login-phone-error' : undefined}
              />
              {errors.phone && (
                <span id="login-phone-error" className={errorClass}>
                  {errors.phone}
                </span>
              )}
            </label>

            <label className="block">
              <span className={labelClass}>Secret code</span>
              <div className="relative">
                <input
                  id="login-code"
                  type={showCode ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.code}
                  onChange={set('code')}
                  placeholder="Enter your secret code"
                  className={`${inputClass} pr-11`}
                  aria-invalid={Boolean(errors.code)}
                  aria-describedby={errors.code ? 'login-code-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowCode((prev) => !prev)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  aria-label={showCode ? 'Hide secret code' : 'Show secret code'}
                >
                  {showCode ? (
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.code && (
                <span id="login-code-error" className={errorClass}>
                  {errors.code}
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
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Need access? Contact{' '}
          <a
            href="mailto:support@raut.co.tz"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            support@raut.co.tz
          </a>
        </p>
      </div>
    </div>
  )
}

export default Login
