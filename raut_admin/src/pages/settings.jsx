import { QueryError } from '../components/queryStates.jsx'
import { useCurrentUser } from '../hooks/useCurrentUser.js'
import { EMPTY, DRIVER_STATUS_LABELS } from '../services/mappers.js'

const valueClass = 'text-sm text-slate-800'

function Settings() {
  const { data, isPending, isError, error, refetch } = useCurrentUser()

  const user = data?.user ?? {}
  const role = data?.role ?? user.role ?? 'user'

  const profile = [
    { label: 'Full name', value: user.full_name ?? EMPTY },
    { label: 'Email', value: user.email ?? EMPTY },
    { label: 'Phone', value: user.phone ?? EMPTY },
    { label: 'Profile photo', value: user.profile_photo_url ?? EMPTY, isLink: Boolean(user.profile_photo_url) },
  ]

  const access = [
    { label: 'Role', value: role.replace('_', ' ') },
    { label: 'Account ID', value: user.id ?? EMPTY },
    { label: 'Driver account', value: user.is_driver ? 'Yes' : 'No' },
    { label: 'Driver status', value: DRIVER_STATUS_LABELS[user.driver_status] ?? user.driver_status ?? EMPTY },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Your account details as the platform knows them.</p>
      </div>

      {isError && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-card">
          <QueryError error={error} onRetry={refetch} />
        </div>
      )}

      {!isError && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Profile</h3>
              <p className="mt-0.5 text-xs text-slate-500">Read only, these details come from your account.</p>
            </div>

            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
              {profile.map((field) => (
                <div key={field.label}>
                  <p className="mb-1.5 text-xs font-semibold text-slate-600">{field.label}</p>
                  {field.isLink ? (
                    <a
                      href={field.value}
                      target="_blank"
                      rel="noreferrer"
                      className={`${valueClass} font-medium text-brand-600 hover:text-brand-700`}
                    >
                      {field.value}
                    </a>
                  ) : (
                    <p className={valueClass}>{isPending ? '—' : field.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Access</h3>
              <p className="mt-0.5 text-xs text-slate-500">What this account is allowed to do.</p>
            </div>

            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
              {access.map((field) => (
                <div key={field.label}>
                  <p className="mb-1.5 text-xs font-semibold text-slate-600">{field.label}</p>
                  <p className={`${valueClass} capitalize`}>{isPending ? '—' : field.value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Settings
