import SidePanel from './SidePanel.jsx'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'
const valueClass = 'block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700'

const statusStyles = {
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'In transit': 'bg-brand-50 text-brand-700 ring-brand-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

function ViewDeliveryPanel({ open, onClose, delivery }) {
  const close = () => onClose()

  return (
    <SidePanel
      open={open}
      onClose={close}
      title="Delivery details"
      description={delivery ? delivery.id : 'View delivery information'}
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
      {delivery && (
        <div className="space-y-4">
          <label className="block">
            <span className={labelClass}>Order ID</span>
            <div className={valueClass}>{delivery.id}</div>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Amount</span>
              <div className={valueClass}>{delivery.amount}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Date</span>
              <div className={valueClass}>{delivery.date}</div>
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>Status</span>
            <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[delivery.status] || 'bg-slate-100 text-slate-600 ring-slate-500/20'}`}>
              {delivery.status}
            </div>
          </label>

          <label className="block">
            <span className={labelClass}>Customer</span>
            <div className={valueClass}>{delivery.customer}</div>
          </label>

          <label className="block">
            <span className={labelClass}>Rider</span>
            <div className={valueClass}>{delivery.rider}</div>
          </label>

          <label className="block">
            <span className={labelClass}>Zone</span>
            <div className={valueClass}>{delivery.zone}</div>
          </label>
        </div>
      )}
    </SidePanel>
  )
}

export default ViewDeliveryPanel
