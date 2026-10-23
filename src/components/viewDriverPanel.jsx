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

function FileIcon() {
  return (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  )
}

function DocumentPreview({ document }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const showImage = Boolean(document.fileUrl) && document.isImage && !failed

  const body = showImage ? (
    <>
      {!loaded && <span className="absolute inset-0 animate-pulse bg-slate-200" />}
      <img
        src={document.fileUrl}
        alt={`${document.typeLabel} document`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        ref={(node) => {
          if (node?.complete && !loaded) setLoaded(true)
        }}
        className={`h-full w-full object-contain transition-opacity duration-150 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-slate-900/60 to-transparent pb-2 pt-8 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="text-xs font-semibold text-white">Open full size</span>
      </span>
    </>
  ) : (
    <span className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
      <FileIcon />
      <span className="px-4 text-center text-xs font-medium">
        {document.fileUrl ? 'Preview unavailable' : 'No file attached'}
      </span>
    </span>
  )

  if (!document.fileUrl) {
    return <div className="relative block h-56 bg-slate-100">{body}</div>
  }

  return (
    <a
      href={document.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${document.typeLabel} in a new tab`}
      className="group relative block h-56 bg-slate-100"
    >
      {body}
    </a>
  )
}

function DocumentCard({ document, onApprove, onReject, pending }) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <DocumentPreview document={document} />
      <span
        className={`badge absolute right-2 top-2 shadow-sm ring-1 ring-inset ${
          documentStatusStyles[document.status] ?? documentStatusStyles['Pending review']
        }`}
      >
        {document.status}
      </span>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{document.typeLabel}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{document.fileName}</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div>
            <dt className="text-slate-400">File</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{document.fileFormatLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Size</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{document.fileSizeLabel}</dd>
          </div>
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
          <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{document.rejectionReason}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
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
            <span className="text-xs text-slate-400">No file</span>
          )}

          {document.isApproved ? (
            <span className="text-xs text-slate-400">
              {document.reviewedAt ? `Approved ${document.reviewedAt}` : 'Approved'}
            </span>
          ) : (
            <div className="flex items-center gap-2.5">
              <button type="button" onClick={onApprove} disabled={pending} className={actionClass}>
                Verify
              </button>
              <button type="button" onClick={onReject} disabled={pending} className={dangerClass}>
                Reject
              </button>
            </div>
          )}
        </div>
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Array.from({ length: 2 }, (_, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-lg border border-slate-200"
                    >
                      <span className="block h-56 animate-pulse bg-slate-100" />
                      <div className="space-y-2.5 p-4">
                        <span className="block h-3.5 w-32 animate-pulse rounded bg-slate-200" />
                        <span className="block h-3 w-24 animate-pulse rounded bg-slate-200" />
                        <span className="block h-3 w-40 animate-pulse rounded bg-slate-200" />
                      </div>
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

              {!isPending && !isError && items.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {items.map((document) => (
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
                </div>
              )}
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
