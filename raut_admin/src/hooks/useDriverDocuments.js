import { useQuery } from '@tanstack/react-query'
import { listDriverDocuments } from '../services/documents.js'
import { queryKeys } from '../lib/queryKeys.js'

export function useDriverDocuments(driverId) {
  return useQuery({
    queryKey: queryKeys.documents.list(driverId),
    queryFn: () => listDriverDocuments(driverId),
    enabled: Boolean(driverId),
  })
}
