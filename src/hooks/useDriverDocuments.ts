import { useQuery } from '@tanstack/react-query'
import { listDriverDocuments } from '../services/documents'
import { queryKeys } from '../lib/queryKeys'

export function useDriverDocuments(driverId) {
  return useQuery({
    queryKey: queryKeys.documents.list(driverId),
    queryFn: () => listDriverDocuments(driverId),
    enabled: Boolean(driverId),
  })
}
