"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Check,
  Clock3,
  Copy,
  FileText,
  History,
  MessageSquare,
  Paperclip,
  Phone,
  ReceiptText,
  Send,
  ShieldAlert,
  Star,
  UserRound,
} from "lucide-react";
import { cn } from "cn";
import { useQueryClient } from "@tanstack/react-query";
import { useSupportAgents, useSupportTicket } from "@/hooks/useSupportTickets";
import { TicketPriorityBadge, TicketStatusBadge } from "@/components/supportTicketBadges";
import { useToast } from "@/components/toastContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/lib/queryKeys";
import {
  formatTicketDateTime,
  formatTicketJoinedDate,
  formatTicketSla,
  SUPPORT_TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from "@/lib/supportTickets";
import type { SupportTicketPriority } from "@/lib/supportTickets";
import {
  addSupportTicketMessage,
  assignSupportTicket,
  claimSupportTicket,
  escalateSupportTicket,
  updateSupportTicketPriority,
  updateSupportTicketStatus,
} from "@/services/supportTickets";

const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-400";
const valueClass = "mt-1 text-sm text-slate-700";
const sectionTitleClass =
  "flex items-center gap-2 text-sm font-semibold text-slate-900";
const sectionIconClass =
  "flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500";
const cardClass = "rounded-xl border border-slate-200 bg-white p-4";

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

const getSlaClass = (status: string, priority: SupportTicketPriority) => {
  if (status === "resolved" || status === "closed") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }

  if (priority === "urgent" || priority === "high") {
    return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }

  return "bg-slate-50 text-slate-600 ring-slate-500/20";
};

function SupportTicketDetail({ ticketId }: { ticketId: string }) {
  const queryClient = useQueryClient();
  const ticketQuery = useSupportTicket(ticketId);
  const agentsQuery = useSupportAgents();
  const ticket = ticketQuery.data?.ticket;
  const detail = ticketQuery.data?.detail;
  const toast = useToast();

  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const runAction = async (
    action: Promise<unknown>,
    successMessage: string,
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      await action;
      await queryClient.invalidateQueries({
        queryKey: queryKeys.supportTickets.all,
      });
      toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The action could not be completed.",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  if (ticketQuery.isPending) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-card">
        <p className="text-sm text-slate-500">Loading ticket details…</p>
      </div>
    );
  }

  if (ticketQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-card">
        <p className="text-sm font-semibold text-rose-700">
          {ticketQuery.error instanceof Error
            ? ticketQuery.error.message
            : "Ticket details could not be loaded."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void ticketQuery.refetch()}
          className="mt-4"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!ticket || !detail) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-card">
        <p className="text-sm font-semibold text-slate-900">
          Ticket not found
        </p>
        <p className="mt-1 text-sm text-slate-500">
          The ticket you are looking for is not available.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/support-tickets">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Tickets
          </Link>
        </Button>
      </div>
    );
  }

  const requesterInitials = getInitials(ticket.requester);
  const profileHref =
    ticket.requesterType === "Driver" ? "/drivers" : "/customers";
  const phoneHref = detail.user.phone
    ? `tel:${detail.user.phone.replace(/\s/g, "")}`
    : undefined;
  const smsHref = detail.user.phone
    ? `sms:${detail.user.phone.replace(/\s/g, "")}`
    : undefined;
  const slaLabel =
    ticket.status === "resolved" || ticket.status === "closed"
      ? "Met"
      : detail.slaMinutes !== undefined
        ? formatTicketSla(detail.slaMinutes)
        : "Not provided";

  const copyTicketId = async () => {
    try {
      await navigator.clipboard.writeText(ticket.id);
      toast.success(`${ticket.id} copied.`);
    } catch {
      toast.error("Could not copy the ticket ID.");
    }
  };

  const isUnassigned = ticket.assignee === "Unassigned" && !ticket.assigneeId;

  const handleAssign = () => {
    void runAction(
      claimSupportTicket(ticket.id),
      `${ticket.id} assigned to you.`,
    );
  };

  const handleReassign = (agentId: string) => {
    void runAction(
      assignSupportTicket(ticket.id, agentId),
      `${ticket.id} assignment updated.`,
    );
  };

  const handlePriority = (priority: SupportTicketPriority) => {
    void runAction(
      updateSupportTicketPriority(ticket.id, priority),
      `Priority changed to ${TICKET_PRIORITY_LABELS[priority].toLowerCase()}.`,
    );
  };

  const handleToggleStatus = () => {
    const nextStatus = ticket.status === "closed" ? "open" : "closed";

    void runAction(
      updateSupportTicketStatus(ticket.id, nextStatus),
      `${ticket.id} marked ${TICKET_STATUS_LABELS[nextStatus].toLowerCase()}.`,
    );
  };

  const handleEscalate = () => {
    if (ticket.priority === "urgent") {
      toast.error("This ticket is already urgent.");
      return;
    }

    void runAction(
      escalateSupportTicket(ticket.id),
      `${ticket.id} escalated.`,
    );
  };

  const handleSendReply = () => {
    const body = reply.trim();

    if (!body) {
      toast.error("Write a reply before sending.");
      return;
    }

    void (async () => {
      const saved = await runAction(
        addSupportTicketMessage(ticket.id, { body, internal: internalNote }),
        internalNote ? "Internal note added." : "Reply sent.",
      );
      if (!saved) return;
      setReply("");
      setInternalNote(false);
    })();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/support-tickets"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Tickets
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-slate-700">
            Ticket {ticket.id}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={copyTicketId}
            aria-label={`Copy ${ticket.id}`}
          >
            <Copy className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <header className="border-b border-slate-200 bg-slate-50/60 px-5 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Support ticket
              </p>
              <h1 className="mt-1 wrap-break-words text-2xl font-bold tracking-tight text-slate-900">
                {ticket.subject}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <TicketStatusBadge status={ticket.status} />
                <TicketPriorityBadge priority={ticket.priority} />
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                    getSlaClass(ticket.status, ticket.priority),
                  )}
                >
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  SLA: {slaLabel}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAssign}
                disabled={!isUnassigned || isSaving}
              >
                <UserRound className="size-3.5" aria-hidden="true" />
                {isUnassigned ? "Assign to Me" : `Assigned to ${ticket.assignee}`}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                  >
                    Reassign
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-elevated ring-0"
                >
                  {agentsQuery.isPending && (
                    <DropdownMenuItem disabled>
                      Loading support agents…
                    </DropdownMenuItem>
                  )}
                  {agentsQuery.isError && (
                    <DropdownMenuItem disabled>
                      Could not load support agents
                    </DropdownMenuItem>
                  )}
                  {(agentsQuery.data ?? []).map((agent) => (
                    <DropdownMenuItem
                      key={agent.id}
                      onSelect={() => handleReassign(agent.id)}
                      disabled={isSaving}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                    >
                      <span>
                        {agent.name}
                        <span className="ml-1 text-slate-400">
                          · {agent.role}
                        </span>
                      </span>
                      {ticket.assigneeId === agent.id && (
                        <Check
                          className="ml-auto size-3.5"
                          aria-hidden="true"
                        />
                      )}
                    </DropdownMenuItem>
                  ))}
                  {!agentsQuery.isPending &&
                    !agentsQuery.isError &&
                    (agentsQuery.data?.length ?? 0) === 0 && (
                      <DropdownMenuItem disabled>
                        No eligible agents
                      </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <ShieldAlert className="size-3.5" aria-hidden="true" />
                    Change Priority
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-elevated ring-0"
                >
                  {SUPPORT_TICKET_PRIORITIES.map((priority) => (
                    <DropdownMenuItem
                      key={priority}
                      onSelect={() => handlePriority(priority)}
                      disabled={isSaving}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                    >
                      {TICKET_PRIORITY_LABELS[priority]}
                      {ticket.priority === priority && (
                        <Check
                          className="ml-auto size-3.5"
                          aria-hidden="true"
                        />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                disabled={isSaving}
              >
                {ticket.status === "closed" ? "Reopen" : "Close"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEscalate}
                disabled={ticket.priority === "urgent" || isSaving}
              >
                Escalate
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:p-6">
          <div className="min-w-0 space-y-6">
            <section aria-labelledby="ticket-user-heading">
              <div className="flex items-center justify-between gap-3">
                <h2 id="ticket-user-heading" className={sectionTitleClass}>
                  <span className={sectionIconClass}>
                    <UserRound className="size-4" aria-hidden="true" />
                  </span>
                  User Information
                </h2>
                <Button asChild variant="outline" size="xs">
                  <Link href={profileHref}>
                    View Profile
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>

              <div className={cn(cardClass, "mt-3")}>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {requesterInitials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {ticket.requester}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ticket.requesterType}
                    </p>
                  </div>
                </div>

                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className={labelClass}>Phone</dt>
                    <dd className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-slate-700">
                        {detail.user.phone ?? "—"}
                      </span>
                      {phoneHref && (
                        <Button asChild variant="outline" size="xs">
                          <a href={phoneHref}>
                            <Phone className="size-3" aria-hidden="true" />
                            Call
                          </a>
                        </Button>
                      )}
                      {smsHref && (
                        <Button asChild variant="outline" size="xs">
                          <a href={smsHref}>
                            <MessageSquare
                              className="size-3"
                              aria-hidden="true"
                            />
                            SMS
                          </a>
                        </Button>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className={labelClass}>Account</dt>
                    <dd className={valueClass}>
                      {detail.user.accountId ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className={labelClass}>Joined</dt>
                    <dd className={valueClass}>
                      {detail.user.joinedAt
                        ? formatTicketJoinedDate(detail.user.joinedAt)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className={labelClass}>Total rides</dt>
                    <dd className={valueClass}>
                      {detail.user.totalRides ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className={labelClass}>Rating</dt>
                    <dd className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
                      <Star
                        className="size-3.5 fill-amber-400 text-amber-400"
                        aria-hidden="true"
                      />
                      {detail.user.rating !== undefined
                        ? detail.user.rating.toFixed(1)
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            <section aria-labelledby="ticket-details-heading">
              <h2 id="ticket-details-heading" className={sectionTitleClass}>
                <span className={sectionIconClass}>
                  <FileText className="size-4" aria-hidden="true" />
                </span>
                Ticket Details
              </h2>

              <dl
                className={cn(
                  cardClass,
                  "mt-3 grid gap-4 sm:grid-cols-2",
                )}
              >
                <div className="sm:col-span-2">
                  <dt className={labelClass}>Subject</dt>
                  <dd className={valueClass}>{ticket.subject}</dd>
                </div>
                <div>
                  <dt className={labelClass}>Category</dt>
                  <dd className={valueClass}>{ticket.category}</dd>
                </div>
                <div>
                  <dt className={labelClass}>Created</dt>
                  <dd className={valueClass}>
                    {ticket.createdAt ? formatTicketDateTime(ticket.createdAt) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className={labelClass}>Last updated</dt>
                  <dd className={valueClass}>
                    {ticket.updatedAt ? formatTicketDateTime(ticket.updatedAt) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className={labelClass}>Assigned to</dt>
                  <dd className={valueClass}>{ticket.assignee}</dd>
                </div>
              </dl>
            </section>

            <section aria-labelledby="ticket-conversation-heading">
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="ticket-conversation-heading"
                  className={sectionTitleClass}
                >
                  <span className={sectionIconClass}>
                    <MessageSquare className="size-4" aria-hidden="true" />
                  </span>
                  Conversation
                </h2>
                <span className="text-xs text-slate-400">
                  {detail.messages.length} message
                  {detail.messages.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {detail.messages.length === 0 && (
                  <p className={cn(cardClass, "text-sm text-slate-500")}>
                    No messages were returned for this ticket.
                  </p>
                )}
                {detail.messages.map((message) => {
                  const isInternal = Boolean(message.internal);
                  const isBot = message.role === "Bot";

                  return (
                    <article
                      key={message.id}
                      className={cn(
                        "rounded-xl border p-4",
                        isInternal
                          ? "border-amber-200 bg-amber-50/70"
                          : isBot
                            ? "border-slate-200 bg-slate-50"
                            : "border-slate-200 bg-white",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "flex size-8 items-center justify-center rounded-full text-xs font-semibold",
                            isInternal
                              ? "bg-amber-100 text-amber-700"
                              : isBot
                                ? "bg-slate-200 text-slate-600"
                                : "bg-brand-50 text-brand-700",
                          )}
                        >
                          {isBot ? (
                            <Bot className="size-4" aria-hidden="true" />
                          ) : (
                            getInitials(message.author)
                          )}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {message.author}
                        </span>
                        <span className="text-xs text-slate-500">
                          {message.role}
                        </span>
                        {isInternal && (
                          <Badge
                            variant="outline"
                            className="rounded-full border-amber-200 bg-amber-100 px-2 text-[10px] font-semibold uppercase tracking-wide text-amber-700"
                          >
                            Internal note
                          </Badge>
                        )}
                        <time
                          dateTime={message.createdAt}
                          className="ml-auto text-xs text-slate-400"
                        >
                          {formatTicketDateTime(message.createdAt)}
                        </time>
                      </div>

                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {message.body}
                      </p>

                      {(message.rideId || message.attachments?.length) && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {message.rideId && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                              <ReceiptText
                                className="size-3"
                                aria-hidden="true"
                              />
                              {message.rideId}
                            </span>
                          )}
                          {message.attachments?.map((attachment) => (
                            <span
                              key={attachment}
                              className="inline-flex max-w-full items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200"
                            >
                              <Paperclip
                                className="size-3 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="truncate">{attachment}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="ticket-reply-heading">
              <h2 id="ticket-reply-heading" className={sectionTitleClass}>
                <span className={sectionIconClass}>
                  <Send className="size-4" aria-hidden="true" />
                </span>
                Your Reply
              </h2>

              <div className={cn(cardClass, "mt-3")}>
                <label htmlFor="ticket-reply" className="sr-only">
                  Reply to ticket
                </label>
                <Textarea
                  id="ticket-reply"
                  rows={4}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Write a reply to the requester..."
                  className="min-h-28 bg-white"
                  disabled={isSaving}
                />

                <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <Checkbox
                      checked={internalNote}
                      onCheckedChange={(checked) =>
                        setInternalNote(Boolean(checked))
                      }
                      disabled={isSaving}
                    />
                    Internal note (not visible to user)
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSendReply}
                      disabled={isSaving || !reply.trim()}
                    >
                      <Send className="size-3.5" aria-hidden="true" />
                      {internalNote ? "Add Note" : "Send Reply"}
                    </Button>
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Replies and internal notes are sent to the support service.
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section aria-labelledby="ticket-history-heading">
              <h2 id="ticket-history-heading" className={sectionTitleClass}>
                <span className={sectionIconClass}>
                  <History className="size-4" aria-hidden="true" />
                </span>
                Ticket History
              </h2>

              <div className={cn(cardClass, "mt-3")}>
                {detail.history.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No ticket history was provided.
                  </p>
                ) : (
                  <ol className="space-y-4">
                    {[...detail.history].reverse().map((entry) => (
                      <li
                        key={entry.id}
                        className="relative border-l border-slate-200 pl-4 last:border-transparent"
                      >
                        <span
                          className="absolute -left-1.25 top-1 size-2 rounded-full bg-slate-300 ring-4 ring-white"
                          aria-hidden="true"
                        />
                        <p className="text-sm font-medium text-slate-700">
                          {entry.label}
                        </p>
                        <time
                          dateTime={entry.createdAt}
                          className="mt-0.5 block text-xs text-slate-400"
                        >
                          {formatTicketDateTime(entry.createdAt)}
                        </time>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default SupportTicketDetail;
