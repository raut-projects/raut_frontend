/**
 * Document checklist query for driver verification screens.
 * Lists a driver's uploaded documents and review status. Collaborates with the
 * documents service and queryKeys.documents.
 */
import { useQuery } from "@tanstack/react-query";
import { listDriverDocuments } from "../services/documents";
import { queryKeys } from "../lib/queryKeys";

/**
 * Fetches the documents belonging to a driver.
 *
 * Query key: `documents.list(driverId)`. Disabled until an id is available and
 * has no polling interval; document mutations invalidate `documents.all` so
 * the list refreshes after a review action.
 *
 * @param driverId - Driver identifier.
 * @returns A React Query result containing the driver's documents.
 */
export function useDriverDocuments(driverId) {
  return useQuery({
    queryKey: queryKeys.documents.list(driverId),
    queryFn: () => listDriverDocuments(driverId),
    enabled: Boolean(driverId),
  });
}
