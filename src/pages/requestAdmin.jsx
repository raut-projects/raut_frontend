import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../components/toastContext.js'
import { useSession } from '../hooks/useSession.js'
import { isAdminRole } from '../lib/roles.js'
import { requestAdminAccess, signOut } from '../services/auth.js'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'
const errorClass = 'mt-1 block text-xs font-medium text-rose-600'

function RequestAdmin() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const session = useSession()
  const queryClient = useQueryClient()

  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [visible, setVisible] = useState(false)

  const requested = location.state?.from ?? '/'
  const from = requested === '/request-admin' ? '/' : requested

  if (!session) {
    return <Navigate to="/login" replace state={{ from: '/request-admin' }} />
  }

  if (isAdminRole(session.role)) {
    return <Navigate to={from} replace />
  }

  const handleChange = (event) => {
    setSecret(event.target.value)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    const value = secret.trim()

    if (!value) {
      setError('Enter the admin secret.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const result = await requestAdminAccess(value)
      toast.success(result.message)
      setSecret('')
      navigate(from, { replace: true })
    } catch (submitError) {
      const message = submitError?.message ?? 'That secret is not correct. Please try again.'

      if (submitError?.requiresSignIn) {
        toast.error(message)
        signOut()
        navigate('/login', { replace: true })
        return
      }

      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignOut = () => {
    signOut()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-xl -translate-x-1/2 rounded-full bg-brand-100/70 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
            Admin access required
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your account is signed in as {session.roleLabel ?? 'User'}. Enter the admin secret to
            open the dashboard.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          {error && (
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
              <p className="text-sm font-medium text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-busy={submitting}>
            <label className="block">
              <span className={labelClass}>Admin secret</span>
              <div className="relative">
                <input
                  id="request-admin-secret"
                  type={visible ? 'text' : 'password'}
                  autoComplete="off"
                  value={secret}
                  onChange={handleChange}
                  placeholder="Enter the admin secret"
                  className={`${inputClass} pr-11`}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'request-admin-secret-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setVisible((previous) => !previous)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  aria-label={visible ? 'Hide the admin secret' : 'Show the admin secret'}
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
              {error && (
                <span id="request-admin-secret-error" className={errorClass}>
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
              {submitting ? 'Checking…' : 'Unlock dashboard'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Signed in with the wrong account?{' '}
          <button
            type="button"
            onClick={handleSignOut}
            className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Sign out
          </button>
        </p>
      </div>
    </div>
  )
}

export default RequestAdmin
