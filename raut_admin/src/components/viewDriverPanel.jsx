import { useState } from 'react'
import SidePanel from './SidePanel.jsx'
import { ReasonDialog } from './reasonDialog.jsx'
import { QueryError } from './queryStates.jsx'
import { useApproveDocument, useRejectDocument } from '../hooks/useAdminActions.js'
import { useDriverDocuments } from '../hooks/useDriverDocuments.js'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'
const valueClass = 'block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700'

const documentStatusStyles = {
  'Pending review': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Expired: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

const actionClass =
  'font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-300'

const dangerClass =
  'font-semibold text-rose-600 transition-colors hover:text-rose-700 disabled:cursor-not-allowed disabled:text-slate-300'

function DocumentCard({ document, onApprove, onReject, pending }) {
  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{document.typeLabel}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{document.fileName}</p>
        </div>
        <span
          className={`badge shrink-0 ring-1 ring-inset ${
            documentStatusStyles[document.status] ?? documentStatusStyles['Pending review']
          }`}
        >
          {document.status}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <dt className="text-slate-400">Uploaded</dt>
          <dd className="mt-0.5 font-medium text-slate-700">{document.uploadedAt}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Expires</dt>
          <dd className="mt-0.5 font-medium text-slate-700">{document.expiry}</dd>
        </div>
      </dl>

      {document.rejectionReason && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{document.rejectionReason}</p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        {document.fileUrl ? (
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Open file
          </a>
        ) : (
          <span className="text-xs text-slate-400">No file attached</span>
        )}

        {document.isApproved ? (
          <span className="text-xs text-slate-400">
            {document.reviewedAt ? `Approved ${document.reviewedAt}` : 'Approved'}
          </span>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onApprove}
              disabled={pending}
              className={actionClass}
            >
              Approve
            </button>
            <button type="button" onClick={onReject} disabled={pending} className={dangerClass}>
              Reject
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

function ViewDriverPanel({ open, onClose, driver }) {
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: documents, isPending, isError, error, refetch } = useDriverDocuments(driver?.id)
  const approveDocument = useApproveDocument()
  const rejectDocument = useRejectDocument()

  const close = () => {
    setRejectTarget(null)
    setRejectReason('')
    onClose()
  }

  // While the reject dialog is open it owns the escape key and the backdrop,
  // so dismissing it does not also close the panel underneath.
  const handlePanelClose = () => {
    if (rejectTarget) return

    close()
  }

  const items = documents ?? []

  return (
    <>
      <SidePanel
        open={open}
        onClose={handlePanelClose}
        title="Driver details"
        description={driver ? driver.name : 'View driver information'}
        wide
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
        {driver && (
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Driver</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelClass}>Full name</span>
                  <div className={valueClass}>{driver.name}</div>
                </label>
                <label className="block">
                  <span className={labelClass}>Status</span>
                  <div className={valueClass}>{driver.status}</div>
                </label>
                <label className="block">
                  <span className={labelClass}>Phone</span>
                  <div className={valueClass}>{driver.phone}</div>
                </label>
                <label className="block">
                  <span className={labelClass}>Email</span>
                  <div className={valueClass}>{driver.email}</div>
                </label>
                <label className="block">
                  <span className={labelClass}>Rides</span>
                  <div className={valueClass}>{driver.rides}</div>
                </label>
                <label className="block">
                  <span className={labelClass}>Rating</span>
                  <div className={valueClass}>{driver.rating.toFixed(1)}</div>
                </label>
                <label className="block">
                  <span className={labelClass}>Joined</span>
                  <div className={valueClass}>{driver.joined}</div>
                </label>
                <label className="block">
                  <span className={labelClass}>Verified</span>
                  <div className={valueClass}>{driver.verifiedAt}</div>
                </label>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Documents</h3>
                <span className="text-xs text-slate-400">{items.length} on file</span>
              </div>

              {isPending && (
                <div className="space-y-3">
                  {Array.from({ length: 2 }, (_, index) => (
                    <div key={index} className="rounded-lg border border-slate-200 p-4">
                      <span className="block h-3.5 w-40 animate-pulse rounded bg-slate-200" />
                      <span className="mt-3 block h-3 w-24 animate-pulse rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              )}

              {isError && (
                <div className="rounded-lg border border-slate-200">
                  <QueryError error={error} onRetry={refetch} />
                </div>
              )}

              {!isPending && !isError && items.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  This driver has not uploaded any documents.
                </p>
              )}

              {!isPending &&
                !isError &&
                items.map((document) => (
                  <DocumentCard
                    key={document.id ?? document.fileName}
                    document={document}
                    pending={approveDocument.isPending || rejectDocument.isPending}
                    onApprove={() => approveDocument.mutate({ documentId: document.id })}
                    onReject={() => {
                      setRejectReason('')
                      setRejectTarget(document)
                    }}
                  />
                ))}
            </section>
          </div>
        )}
      </SidePanel>

      <ReasonDialog
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject document"
        description={
          rejectTarget ? `${rejectTarget.typeLabel} for ${driver?.name ?? 'this driver'} will be rejected.` : undefined
        }
        confirmLabel="Reject"
        placeholder="Why is this document rejected?"
        value={rejectReason}
        onChange={setRejectReason}
        pending={rejectDocument.isPending}
        onConfirm={async (reason) => {
          await rejectDocument.mutateAsync({ documentId: rejectTarget.id, reason })
          setRejectTarget(null)
        }}
      />
    </>
  )
}

export default ViewDriverPanel
