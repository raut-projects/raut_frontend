import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import {
  createSupportTicketDetail,
  createSupportTickets,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from "@/lib/supportTickets";
import type {
  SupportTicket,
  SupportTicketDetail,
  SupportTicketHistoryEntry,
  SupportTicketMessage,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/lib/supportTickets";

type ReplyInput = {
  body: string;
  internal: boolean;
  author: string;
  attachments?: string[];
};

type SupportTicketsState = {
  tickets: SupportTicket[];
  details: Record<string, SupportTicketDetail>;
  getTicket: (id: string) => SupportTicket | undefined;
  getDetail: (id: string) => SupportTicketDetail | null;
  assignTicket: (id: string, assignee: string, actor: string) => void;
  setTicketPriority: (
    id: string,
    priority: SupportTicketPriority,
    actor: string,
  ) => void;
  setTicketStatus: (
    id: string,
    status: SupportTicketStatus,
    actor: string,
  ) => void;
  escalateTicket: (id: string, actor: string) => void;
  addReply: (id: string, input: ReplyInput) => void;
  reset: () => void;
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

const createHistoryEntry = (
  label: string,
  actor: string,
  createdAt: string,
): SupportTicketHistoryEntry => ({
  id: createId("history"),
  label,
  createdAt,
  actor,
});

export const useSupportTicketsStore = create<SupportTicketsState>()(
  (set, get) => {
    const applyTicketUpdate = (
      id: string,
      patch: Partial<Pick<SupportTicket, "assignee" | "priority" | "status">>,
      historyLabel: string,
      actor: string,
    ) => {
      const { tickets, details } = get();
      const ticket = tickets.find((item) => item.id === id);

      if (!ticket) return;

      const updatedAt = new Date().toISOString();
      const nextTicket = { ...ticket, ...patch, updatedAt };
      const detail = details[id] ?? createSupportTicketDetail(ticket);

      set({
        tickets: tickets.map((item) => (item.id === id ? nextTicket : item)),
        details: {
          ...details,
          [id]: {
            ...detail,
            history: [
              ...detail.history,
              createHistoryEntry(historyLabel, actor, updatedAt),
            ],
          },
        },
      });
    };

    return {
      tickets: createSupportTickets(),
      details: {},

      reset: () => set({ tickets: createSupportTickets(), details: {} }),

      getTicket: (id) => get().tickets.find((ticket) => ticket.id === id),

      getDetail: (id) => {
        const { tickets, details } = get();
        const ticket = tickets.find((item) => item.id === id);

        if (!ticket) return null;

        return details[id] ?? createSupportTicketDetail(ticket);
      },

      assignTicket: (id, assignee, actor) => {
        applyTicketUpdate(id, { assignee }, `Assigned to ${assignee}`, actor);
      },

      setTicketPriority: (id, priority, actor) => {
        applyTicketUpdate(
          id,
          { priority },
          `Priority changed to ${TICKET_PRIORITY_LABELS[priority]}`,
          actor,
        );
      },

      setTicketStatus: (id, status, actor) => {
        applyTicketUpdate(
          id,
          { status },
          `Status changed to ${TICKET_STATUS_LABELS[status]}`,
          actor,
        );
      },

      escalateTicket: (id, actor) => {
        applyTicketUpdate(id, { priority: "urgent" }, "Ticket escalated", actor);
      },

      addReply: (id, input) => {
        const { tickets, details } = get();
        const ticket = tickets.find((item) => item.id === id);

        if (!ticket) return;

        const updatedAt = new Date().toISOString();
        const detail = details[id] ?? createSupportTicketDetail(ticket);
        const message: SupportTicketMessage = {
          id: createId("message"),
          author: input.author,
          role: "Agent",
          body: input.body,
          createdAt: updatedAt,
          internal: input.internal || undefined,
          rideId: detail.rideId,
          attachments: input.attachments?.length
            ? input.attachments
            : undefined,
        };

        set({
          tickets: tickets.map((item) =>
            item.id === id ? { ...item, updatedAt } : item,
          ),
          details: {
            ...details,
            [id]: {
              ...detail,
              messages: [...detail.messages, message],
              history: [
                ...detail.history,
                createHistoryEntry(
                  input.internal
                    ? `Internal note added by ${input.author}`
                    : `Reply sent by ${input.author}`,
                  input.author,
                  updatedAt,
                ),
              ],
            },
          },
        });
      },
    };
  },
);

export function useSupportTickets() {
  return useSupportTicketsStore(
    useShallow((state) => ({
      tickets: state.tickets,
      getTicket: state.getTicket,
      getDetail: state.getDetail,
      assignTicket: state.assignTicket,
      setTicketPriority: state.setTicketPriority,
      setTicketStatus: state.setTicketStatus,
      escalateTicket: state.escalateTicket,
      addReply: state.addReply,
    })),
  );
}
