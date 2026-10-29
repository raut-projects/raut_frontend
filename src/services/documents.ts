import { API_ROUTES } from '../lib/config.js'
import { apiGet, apiPut } from './api.js'
import { mapDocument } from './mappers.js'

// A driver keeps a handful of documents, so one generous page covers them all.
const DOCUMENT_PAGE_SIZE = 100

// The admin list has no declared response model, so the payload is read
// defensively: the documents may sit under `documents`, under `items`, or be
// the array itself.
const asDocumentList = (payload) => {
  if (Array.isArray(payload)) return payload

  return payload?.documents ?? payload?.items ?? []
}

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

export const approveDocument = (documentId, notes) =>
  apiPut(`${API_ROUTES.documents}/${documentId}/approve`, notes ? { notes } : {})

export const rejectDocument = (documentId, reason) =>
  apiPut(`${API_ROUTES.documents}/${documentId}/reject`, { reason })
