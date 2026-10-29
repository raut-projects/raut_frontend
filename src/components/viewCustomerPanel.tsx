import SidePanel from './SidePanel'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'
const valueClass = 'block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700'

function ViewCustomerPanel({ open, onClose, customer }) {
  const close = () => onClose()

  return (
    <SidePanel
      open={open}
      onClose={close}
      title="Customer details"
      description={customer ? customer.name : 'View customer information'}
      footer={
        <button
          type="button"
          onClick={close}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Close
        </button>
      }
    >
      {customer && (
        <div className="space-y-4">
          <label className="block">
            <span className={labelClass}>Full name</span>
            <div className={valueClass}>{customer.name}</div>
          </label>

          <label className="block">
            <span className={labelClass}>Email</span>
            <div className={valueClass}>{customer.email}</div>
          </label>

          {customer.phone && (
            <label className="block">
              <span className={labelClass}>Phone</span>
              <div className={valueClass}>{customer.phone}</div>
            </label>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Orders</span>
              <div className={valueClass}>{customer.orders}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Status</span>
              <div className={valueClass}>{customer.status}</div>
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>Role</span>
            <div className={`${valueClass} capitalize`}>{customer.role?.replace('_', ' ')}</div>
          </label>

          <label className="block">
            <span className={labelClass}>Joined</span>
            <div className={valueClass}>{customer.joined}</div>
          </label>

          {customer.id != null && (
            <label className="block">
              <span className={labelClass}>Customer ID</span>
              <div className={valueClass}>#{customer.id}</div>
            </label>
          )}
        </div>
      )}
    </SidePanel>
  )
}

export default ViewCustomerPanel
