import { useState } from 'react'
import SidePanel from './SidePanel.jsx'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'
const errorClass = 'mt-1 block text-xs font-medium text-rose-600'

const initialForm = { name: '', email: '', phone: '', status: 'Active' }

function AddCustomerPanel({ open, onClose, onCreate }) {
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
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onCreate({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: form.status,
    })
    close()
  }

  return (
    <SidePanel
      open={open}
      onClose={close}
      title="Add customer"
      description="Create a new customer account."
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
            form="add-customer-form"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Add customer
          </button>
        </>
      }
    >
      <form id="add-customer-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <label className="block">
          <span className={labelClass}>Full name</span>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Maya Chen"
            className={inputClass}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <span className={errorClass}>{errors.name}</span>}
        </label>

        <label className="block">
          <span className={labelClass}>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="e.g. maya.chen@example.com"
            className={inputClass}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <span className={errorClass}>{errors.email}</span>}
        </label>

        <label className="block">
          <span className={labelClass}>Phone</span>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="e.g. +255 655 555 0123"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-slate-400">Optional</span>
        </label>

        <label className="block">
          <span className={labelClass}>Status</span>
          <select value={form.status} onChange={set('status')} className={inputClass}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
      </form>
    </SidePanel>
  )
}

export default AddCustomerPanel

