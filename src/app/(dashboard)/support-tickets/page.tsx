"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Copy,
  Download,
  EllipsisVertical,
  Eye,
  Plus,
  Search,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/supportTicketBadges";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  useSupportTickets,
} from "@/hooks/useSupportTickets";
import { usePageViewField } from "@/store/pageViewStore";
import { queryKeys } from "@/lib/queryKeys";
import {
  downloadSupportTicketsCsv,
  formatTicketUpdated,
  SUPPORT_TICKET_ASSIGNEES,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from "@/lib/supportTickets";
import type {
  SupportTicketStatus,
} from "@/lib/supportTickets";
import { listSupportTickets, updateSupportTicketStatus } from "@/services/supportTickets";

const PAGE_SIZE = 25;

const STATUS_TABS: Array<{ value: SupportTicketStatus | "all"; label: string }> =
  [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "in-progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

const controlClass =
  "h-9 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

function SupportTicketsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = usePageViewField("supportTickets", "status");
  const [search, setSearch] = usePageViewField("supportTickets", "search");
  const [priority, setPriority] = usePageViewField("supportTickets", "priority");
  const [category, setCategory] = usePageViewField(
    "supportTickets",
    "category",
  );
  const [assignee, setAssignee] = usePageViewField(
    "supportTickets",
    "assignee",
  );
  const [page, setPage] = usePageViewField("supportTickets", "page");

  const debouncedSearch = useDebouncedValue(search, 300);
  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      status,
      priority,
      category,
      assignee,
    }),
    [page, debouncedSearch, status, priority, category, assignee],
  );
  const ticketQuery = useSupportTickets(params);
  const urgentQuery = useSupportTickets({
    page: 1,
    limit: 1,
    status: "open",
    priority: "urgent",
  });

  const visibleTickets = ticketQuery.data?.items ?? [];
  const total = ticketQuery.data?.total ?? 0;
  const urgentCount = urgentQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const rangeStart = total === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + PAGE_SIZE, total);
  const rangeLabel =
    rangeEnd > rangeStart ? `${rangeStart}-${rangeEnd}` : String(rangeStart);

  const hasFilters =
    search.trim() !== "" ||
    status !== "all" ||
    priority !== "all" ||
    category !== "all" ||
    assignee !== "all";

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, setPage, totalPages]);

  const resetPage = () => setPage(1);

  const onSearchChange = (event) => {
    setSearch(event.target.value);
    resetPage();
  };

  const onStatusChange = (next: SupportTicketStatus | "all") => {
    setStatus(next);
    resetPage();
  };

  const onPriorityChange = (next: (typeof priority)) => {
    setPriority(next);
    resetPage();
  };

  const onCategoryChange = (next: string) => {
    setCategory(next);
    resetPage();
  };

  const onAssigneeChange = (next: string) => {
    setAssignee(next);
    resetPage();
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setCategory("all");
    setAssignee("all");
    resetPage();
  };

  const showUrgentTickets = () => {
    setSearch("");
    setStatus("open");
    setPriority("urgent");
    setCategory("all");
    setAssignee("all");
    resetPage();
  };

  const updateTicketStatus = (
    ticketId: string,
    nextStatus: SupportTicketStatus,
  ) => {
    void updateSupportTicketStatus(ticketId, nextStatus)
      .then(() => {
        toast.success(
          `${ticketId} marked ${TICKET_STATUS_LABELS[nextStatus].toLowerCase()}.`,
        );
        return queryClient.invalidateQueries({
          queryKey: queryKeys.supportTickets.all,
        });
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not update the ticket status.",
        );
      });
  };

  const copyTicketId = async (ticketId: string) => {
    try {
      await navigator.clipboard.writeText(ticketId);
      toast.success(`${ticketId} copied.`);
    } catch {
      toast.error("Could not copy the ticket ID.");
    }
  };

  const exportTickets = async () => {
    if (total === 0) {
      toast.error("There are no tickets to export.");
      return;
    }

    setIsExporting(true);
    try {
      const filters = {
        search: debouncedSearch,
        status,
        priority,
        category,
        assignee,
      };
      const exported = [];
      const seen = new Set<string>();
      let exportPage = 1;
      let exportTotal = total;

      while (exported.length < exportTotal) {
        const result = await listSupportTickets({
          ...filters,
          page: exportPage,
          limit: 100,
        });
        const newItems = result.items.filter((ticket) => !seen.has(ticket.id));
        if (newItems.length === 0) break;
        newItems.forEach((ticket) => seen.add(ticket.id));
        exported.push(...newItems);
        exportTotal = result.total;
        exportPage += 1;
      }

      if (exported.length === 0) {
        toast.error("No tickets were returned for export.");
        return;
      }
      if (exported.length < exportTotal) {
        throw new Error(
          "The ticket list did not return every matching record. Please try exporting again.",
        );
      }
      downloadSupportTicketsCsv(exported);
      toast.success(
        `Exported ${exported.length} ticket${exported.length === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not export tickets.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Support Tickets
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Review and respond to rider and driver support requests.
        </p>
      </div>

      { urgentQuery.isError && (
        <p role="status" className="text-sm text-rose-700">
          Could not load the urgent ticket count.
        </p>
      ) }

      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link href="/support-tickets/new">
            <Plus className="size-4" aria-hidden="true" />
            Create ticket
          </Link>
        </Button>
      </div>

      <div
        className="flex gap-1 overflow-x-auto border-b border-slate-200"
        aria-label="Filter tickets by status"
      >
        { STATUS_TABS.map((tab) => {
          const active = status === tab.value;

          return (
            <button
              key={ tab.value }
              type="button"
              onClick={ () => onStatusChange(tab.value) }
              aria-pressed={ active }
              className={ `-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${active
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700"
                }` }
            >
              { tab.label }
            </button>
          );
        }) }
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={ search }
            onChange={ onSearchChange }
            placeholder="Search by ticket ID, user, or issue."
            aria-label="Search support tickets"
            className="h-9 bg-white pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:ml-auto">
          <select
            value={ priority }
            onChange={ (event) =>
              onPriorityChange(event.target.value as typeof priority)
            }
            aria-label="Filter tickets by priority"
            className={ `${controlClass} pl-3 pr-8` }
          >
            <option value="all">All priorities</option>
            { SUPPORT_TICKET_PRIORITIES.map((item) => (
              <option key={ item } value={ item }>
                { TICKET_PRIORITY_LABELS[item] }
              </option>
            )) }
          </select>

          <select
            value={ category }
            onChange={ (event) => onCategoryChange(event.target.value) }
            aria-label="Filter tickets by category"
            className={ `${controlClass} pl-3 pr-8` }
          >
            <option value="all">All categories</option>
            { SUPPORT_TICKET_CATEGORIES.map((item) => (
              <option key={ item } value={ item }>
                { item }
              </option>
            )) }
          </select>

          <select
            value={ assignee }
            onChange={ (event) => onAssigneeChange(event.target.value) }
            aria-label="Filter tickets by assignee"
            className={ `${controlClass} pl-3 pr-8` }
          >
            <option value="all">All assignees</option>
            { SUPPORT_TICKET_ASSIGNEES.map((item) => (
              <option key={ item } value={ item }>
                { item }
              </option>
            )) }
          </select>
        </div>
      </div>

      { urgentCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
              <AlertTriangle className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-rose-900">
                { urgentCount } urgent ticket{ urgentCount === 1 ? "" : "s" }{ " " }
                { urgentCount === 1 ? "needs" : "need" } response
              </p>
              <p className="mt-0.5 text-sm text-rose-700">
                Prioritize these requests to keep response times on target.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={ showUrgentTickets }
            className="h-auto border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            View urgent
          </Button>
        </div>
      ) }

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
          <p className="text-xs text-slate-500">
            Showing{ " " }
            <span className="font-semibold text-slate-700">{ rangeLabel }</span>{ " " }
            of <span className="font-semibold text-slate-700">{ total }</span>{ " " }
            ticket{ total === 1 ? "" : "s" }
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={ exportTickets }
            disabled={ total === 0 || isExporting }
            className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="size-3.5" aria-hidden="true" />
            { isExporting ? "Exporting…" : "Export" }
          </Button>
        </div>

        <Table>
          <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-24">ID</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Updated</TableHead>
              <TableHead className="w-12 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            { ticketQuery.isError && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={ 6 }
                  className="px-4 py-12 text-center whitespace-normal"
                >
                  <p className="text-sm font-medium text-rose-700">
                    { ticketQuery.error instanceof Error
                      ? ticketQuery.error.message
                      : "Support tickets could not be loaded." }
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={ () => void ticketQuery.refetch() }
                    className="mt-3"
                  >
                    Try again
                  </Button>
                </TableCell>
              </TableRow>
            ) }
            { ticketQuery.isPending && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={ 6 } className="px-4 py-12 text-center">
                  <span className="text-sm text-slate-500">
                    Loading support tickets…
                  </span>
                </TableCell>
              </TableRow>
            ) }
            { visibleTickets.map((ticket) => (
              <TableRow key={ ticket.id }>
                <TableCell>
                  <span className="font-semibold text-slate-900">
                    { ticket.id }
                  </span>
                </TableCell>
                <TableCell className="max-w-120 whitespace-normal">
                  <Link
                    href={ `/support-tickets/${encodeURIComponent(ticket.id)}` }
                    className="block max-w-[16rem] truncate font-medium text-slate-900 transition-colors hover:text-brand-600 sm:max-w-104"
                  >
                    { ticket.subject }
                  </Link>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    { ticket.requester } · { ticket.requesterType } ·{ " " }
                    { ticket.category }
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400 md:hidden">
                    Updated { formatTicketUpdated(ticket.updatedAt) }
                  </span>
                </TableCell>
                <TableCell>
                  <TicketPriorityBadge priority={ ticket.priority } />
                </TableCell>
                <TableCell>
                  <TicketStatusBadge status={ ticket.status } />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="block text-slate-600">
                    { formatTicketUpdated(ticket.updatedAt) }
                  </span>
                  <span className="block text-xs text-slate-400">
                    { ticket.assignee }
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label={ `Actions for ${ticket.id}` }
                      >
                        <EllipsisVertical
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-elevated ring-0"
                    >
                      <DropdownMenuItem
                        asChild
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                      >
                        <Link
                          href={ `/support-tickets/${encodeURIComponent(ticket.id)}` }
                        >
                          <Eye className="size-3.5" aria-hidden="true" />
                          View ticket
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={ () => copyTicketId(ticket.id) }
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                      >
                        <Copy className="size-3.5" aria-hidden="true" />
                        Copy ticket ID
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-100" />
                      { ticket.status !== "in-progress" &&
                        ticket.status !== "resolved" &&
                        ticket.status !== "closed" && (
                          <DropdownMenuItem
                            onSelect={ () =>
                              updateTicketStatus(ticket.id, "in-progress")
                            }
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                          >
                            Mark in progress
                          </DropdownMenuItem>
                        ) }
                      { ticket.status !== "resolved" && (
                        <DropdownMenuItem
                          onSelect={ () =>
                            updateTicketStatus(ticket.id, "resolved")
                          }
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                        >
                          Resolve
                        </DropdownMenuItem>
                      ) }
                      { ticket.status !== "closed" && (
                        <DropdownMenuItem
                          onSelect={ () => updateTicketStatus(ticket.id, "closed") }
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                        >
                          Close
                        </DropdownMenuItem>
                      ) }
                      { (ticket.status === "resolved" ||
                        ticket.status === "closed") && (
                          <DropdownMenuItem
                            onSelect={ () => updateTicketStatus(ticket.id, "open") }
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                          >
                            Reopen
                          </DropdownMenuItem>
                        ) }
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) }

            { !ticketQuery.isError &&
              !ticketQuery.isPending &&
              visibleTickets.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={ 6 }
                    className="px-4 py-12 text-center whitespace-normal"
                  >
                    <p className="text-sm font-medium text-slate-700">
                      No tickets match these filters.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try a different search or reset the filters.
                    </p>
                    { hasFilters && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={ clearFilters }
                        className="mt-3 h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Clear filters
                      </Button>
                    ) }
                  </TableCell>
                </TableRow>
              ) }
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3.5 sm:px-5">
          <p className="text-xs text-slate-500">
            Showing{ " " }
            <span className="font-semibold text-slate-700">{ rangeLabel }</span>{ " " }
            of <span className="font-semibold text-slate-700">{ total }</span>{ " " }
            ticket{ total === 1 ? "" : "s" }
            { totalPages > 1 && (
              <>
                { " " }
                · Page{ " " }
                <span className="font-semibold text-slate-700">
                  { currentPage }
                </span>{ " " }
                of{ " " }
                <span className="font-semibold text-slate-700">
                  { totalPages }
                </span>
              </>
            ) }
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={ () => setPage(Math.max(1, currentPage - 1)) }
              disabled={ currentPage <= 1 }
              className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-100"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={ () => setPage(Math.min(totalPages, currentPage + 1)) }
              disabled={ currentPage >= totalPages }
              className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-100"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportTicketsPage;
