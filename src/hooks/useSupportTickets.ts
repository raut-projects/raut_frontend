/**
 * Support ticket hooks with 30s polling and agent list (5m stale).
 * Collaborates with supportTickets service and queryKeys.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getSupportTicketDetail,
  listSupportAgents,
  listSupportTickets,
  SupportTicketListParams,
} from "@/services/supportTickets";
import { queryKeys } from "@/lib/queryKeys";
import { polledQueryOptions } from "@/lib/queryClient";

/**
 * useSupportTickets hook.
 */
export function useSupportTickets(params: SupportTicketListParams) {
  return useQuery({
    queryKey: queryKeys.supportTickets.list(params),
    queryFn: ({ signal }) => listSupportTickets(params, { signal }),
    placeholderData: keepPreviousData,
    ...polledQueryOptions,
    refetchInterval: 30_000,
  });
}

/**
 * useSupportTicket hook.
 */
export function useSupportTicket(ticketId: string) {
  return useQuery({
    queryKey: queryKeys.supportTickets.detail(ticketId),
    queryFn: ({ signal }) => getSupportTicketDetail(ticketId, { signal }),
    enabled: Boolean(ticketId),
    ...polledQueryOptions,
    refetchInterval: 30_000,
  });
}

/**
 * useSupportAgents hook.
 */
export function useSupportAgents() {
  return useQuery({
    queryKey: queryKeys.supportTickets.agents,
    queryFn: ({ signal }) => listSupportAgents({ signal }),
    staleTime: 5 * 60_000,
  });
}
