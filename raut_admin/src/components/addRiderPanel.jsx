import { useState } from 'react'
import SidePanel from './SidePanel.jsx'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'
const errorClass = 'mt-1 block text-xs font-medium text-rose-600'

const zones = ['Downtown', 'Westside', 'Midtown', 'Harbor', 'Eastend', 'Northgate', 'Southbank']

const initialForm = { name: '', phone: '', zone: 'Downtown', status: 'Offline' }

function AddRiderPanel({ open, onClose, onCreate }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  const close = () => {
    setForm(initialForm)
    setErrors({})
    onClose()
  }

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Full name is required.'
    if (!form.phone.trim()) next.phone = 'Phone number is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onCreate({
      name: form.name.trim(),
      phone: form.phone.trim(),
      zone: form.zone,
      status: form.status,
    })
    close()
  }

  return (
    <SidePanel
      open={open}
      onClose={close}
      title="Add rider"
      description="Register a new rider on the fleet."
      footer={
        <>
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-rider-form"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Add rider
          </button>
        </>
      }
    >
      <form id="add-rider-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <label className="block">
          <span className={labelClass}>Full name</span>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Daniel Okafor"
            className={inputClass}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <span className={errorClass}>{errors.name}</span>}
        </label>

        <label className="block">
          <span className={labelClass}>Phone</span>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="e.g. +255 655 555 0132"
            className={inputClass}
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone && <span className={errorClass}>{errors.phone}</span>}
        </label>

        <label className="block">
          <span className={labelClass}>Zone</span>
          <select value={form.zone} onChange={set('zone')} className={inputClass}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Status</span>
          <select value={form.status} onChange={set('status')} className={inputClass}>
            <option value="Offline">Offline</option>
            <option value="Online">Online</option>
            <option value="Delivering">Delivering</option>
          </select>
        </label>
      </form>
    </SidePanel>
  )
}

export default AddRiderPanel

