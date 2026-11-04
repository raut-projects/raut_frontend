"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
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

type SupportTicketsContextValue = {
  tickets: SupportTicket[];
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
};

const SupportTicketsContext =
  createContext<SupportTicketsContextValue | null>(null);

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

export function SupportTicketsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tickets, setTickets] = useState<SupportTicket[]>(() =>
    createSupportTickets(),
  );
  const [details, setDetails] = useState<Record<string, SupportTicketDetail>>(
    {},
  );

  const getTicket = useCallback(
    (id: string) => tickets.find((ticket) => ticket.id === id),
    [tickets],
  );

  const getDetail = useCallback(
    (id: string) => {
      const ticket = tickets.find((item) => item.id === id);

      if (!ticket) return null;

      return details[id] ?? createSupportTicketDetail(ticket);
    },
    [tickets, details],
  );

  const updateDetail = useCallback(
    (
      ticket: SupportTicket,
      updater: (detail: SupportTicketDetail) => SupportTicketDetail,
    ) => {
      setDetails((current) => {
        const detail = current[ticket.id] ?? createSupportTicketDetail(ticket);

        return { ...current, [ticket.id]: updater(detail) };
      });
    },
    [],
  );

  const applyTicketUpdate = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<SupportTicket, "assignee" | "priority" | "status">
      >,
      historyLabel: string,
      actor: string,
    ) => {
      const ticket = tickets.find((item) => item.id === id);

      if (!ticket) return;

      const updatedAt = new Date().toISOString();
      const nextTicket = { ...ticket, ...patch, updatedAt };

      setTickets((current) =>
        current.map((item) => (item.id === id ? nextTicket : item)),
      );
      updateDetail(ticket, (detail) => ({
        ...detail,
        history: [
          ...detail.history,
          createHistoryEntry(historyLabel, actor, updatedAt),
        ],
      }));
    },
    [tickets, updateDetail],
  );

  const assignTicket = useCallback(
    (id: string, assignee: string, actor: string) => {
      applyTicketUpdate(
        id,
        { assignee },
        `Assigned to ${assignee}`,
        actor,
      );
    },
    [applyTicketUpdate],
  );

  const setTicketPriority = useCallback(
    (id: string, priority: SupportTicketPriority, actor: string) => {
      applyTicketUpdate(
        id,
        { priority },
        `Priority changed to ${TICKET_PRIORITY_LABELS[priority]}`,
        actor,
      );
    },
    [applyTicketUpdate],
  );

  const setTicketStatus = useCallback(
    (id: string, status: SupportTicketStatus, actor: string) => {
      applyTicketUpdate(
        id,
        { status },
        `Status changed to ${TICKET_STATUS_LABELS[status]}`,
        actor,
      );
    },
    [applyTicketUpdate],
  );

  const escalateTicket = useCallback(
    (id: string, actor: string) => {
      applyTicketUpdate(id, { priority: "urgent" }, "Ticket escalated", actor);
    },
    [applyTicketUpdate],
  );

  const addReply = useCallback(
    (id: string, input: ReplyInput) => {
      const ticket = tickets.find((item) => item.id === id);

      if (!ticket) return;

      const updatedAt = new Date().toISOString();

      setTickets((current) =>
        current.map((item) =>
          item.id === id ? { ...item, updatedAt } : item,
        ),
      );
      setDetails((current) => {
        const detail =
          current[id] ?? createSupportTicketDetail(ticket);
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

        return {
          ...current,
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
        };
      });
    },
    [tickets],
  );

  const value = useMemo(
    () => ({
      tickets,
      getTicket,
      getDetail,
      assignTicket,
      setTicketPriority,
      setTicketStatus,
      escalateTicket,
      addReply,
    }),
    [
      tickets,
      getTicket,
      getDetail,
      assignTicket,
      setTicketPriority,
      setTicketStatus,
      escalateTicket,
      addReply,
    ],
  );

  return (
    <SupportTicketsContext.Provider value={value}>
      {children}
    </SupportTicketsContext.Provider>
  );
}

export function useSupportTickets() {
  const context = useContext(SupportTicketsContext);

  if (!context) {
    throw new Error(
      "useSupportTickets must be used within SupportTicketsProvider",
    );
  }

  return context;
}
