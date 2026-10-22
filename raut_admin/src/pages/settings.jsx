import { QueryError } from '../components/queryStates.jsx'
import { useCurrentUser } from '../hooks/useCurrentUser.js'
import { EMPTY, DRIVER_STATUS_LABELS } from '../services/mappers.js'

const valueClass = 'text-sm text-slate-800'

function Settings() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Manage your account and preferences.</p>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{section.description}</p>
          </div>

          {section.fields && (
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
              {section.fields.map((field) => (
                <label key={field.label} className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">{field.label}</span>
                  <input
                    type={field.type}
                    defaultValue={field.value}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </label>
              ))}
            </div>
          )}

          {section.toggles && (
            <ul className="divide-y divide-slate-100 px-5">
              {section.toggles.map((toggle) => (
                <li key={toggle.label} className="flex items-center justify-between py-3.5">
                  <span className="text-sm text-slate-700">{toggle.label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={toggle.checked}
                    aria-label={toggle.label}
                    className={`relative h-5 w-9 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                      toggle.checked ? 'bg-brand-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        toggle.checked ? 'left-0.5 translate-x-4' : 'left-0.5 translate-x-0'
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Save changes
        </button>
      </div>
    </div>
  )
}

export default Settings
