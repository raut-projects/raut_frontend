/**
 * Support ticket hooks with 30s polling and agent list (5m stale).
 * Collaborates with supportTickets service and queryKeys.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getSupportTicketDetail,
  listSupportAgents,
  listSupportTickets,
} from "@/services/supportTickets";
import type { SupportTicketListParams } from "@/services/supportTickets";
import { queryKeys } from "@/lib/queryKeys";

/**
 * useSupportTickets hook.
 */
export function useSupportTickets(params: SupportTicketListParams) {
  return useQuery({
    queryKey: queryKeys.supportTickets.list(params),
    queryFn: () => listSupportTickets(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

/**
 * useSupportTicket hook.
 */
export function useSupportTicket(ticketId: string) {
  return useQuery({
    queryKey: queryKeys.supportTickets.detail(ticketId),
    queryFn: () => getSupportTicketDetail(ticketId),
    enabled: Boolean(ticketId),
    refetchInterval: 30_000,
  });
}

/**
 * useSupportAgents hook.
 */
export function useSupportAgents() {
  return useQuery({
    queryKey: queryKeys.supportTickets.agents,
    queryFn: listSupportAgents,
    staleTime: 5 * 60_000,
  });
}
