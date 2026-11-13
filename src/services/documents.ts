// Driver document review service.
// Lists the documents attached to a driver and approves or rejects individual
// documents. All calls use the shared `./api` helpers, so a failed review
// rejects with ApiError.

import { API_ROUTES } from '../lib/config'
import { apiGet, apiPut } from './api'
import { mapDocument } from './mappers'

// A driver keeps a handful of documents, so one generous page covers them all.
const DOCUMENT_PAGE_SIZE = 100

// The admin list has no declared response model, so the payload is read
// defensively: the documents may sit under `documents`, under `items`, or be
// the array itself.
const asDocumentList = (payload) => {
  if (Array.isArray(payload)) return payload

  return payload?.documents ?? payload?.items ?? []
}

/**
 * Loads every document for a driver.
 * GET /drivers/documents with `driver_id`, page 1, a 100-row page, newest first.
 * Returns the documents mapped for the admin UI. Throws ApiError on failure.
 */
export async function listDriverDocuments(driverId) {
  const data = await apiGet(API_ROUTES.documents, {
    params: {
      driver_id: driverId,
      page: 1,
      page_size: DOCUMENT_PAGE_SIZE,
      sort_by: 'created_at',
      sort_order: 'desc',
    },
  })

  return asDocumentList(data).map(mapDocument)
}

/**
 * Approves a document, optionally attaching reviewer notes.
 * PUT /drivers/documents/:documentId/approve with `{ notes }` or an empty body.
 * Returns the unwrapped response payload. Throws ApiError on failure.
 */
export const approveDocument = (documentId, notes) =>
  apiPut(`${API_ROUTES.documents}/${documentId}/approve`, notes ? { notes } : {})

/**
 * Rejects a document with a reviewer reason.
 * PUT /drivers/documents/:documentId/reject with `{ reason }`.
 * Returns the unwrapped response payload. Throws ApiError on failure.
 */
export const rejectDocument = (documentId, reason) =>
  apiPut(`${API_ROUTES.documents}/${documentId}/reject`, { reason })
