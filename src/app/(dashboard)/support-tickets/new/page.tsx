"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/toastContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
} from "@/lib/supportTickets";
import type {
  SupportTicketPriority,
  SupportTicketRequesterType,
} from "@/lib/supportTickets";
import {
  createSupportTicket,
  type CreateSupportTicketInput,
} from "@/services/supportTickets";

const initialForm: CreateSupportTicketInput = {
  requesterId: "",
  requesterType: "Rider",
  subject: "",
  category: SUPPORT_TICKET_CATEGORIES[0] ?? "",
  priority: "medium",
  message: "",
};

function NewSupportTicketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof CreateSupportTicketInput>(
    key: K,
    value: CreateSupportTicketInput[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const ticketId = await createSupportTicket(form);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.supportTickets.all,
      });
      toast.success("Support ticket created.");
      router.push(`/support-tickets/${encodeURIComponent(ticketId)}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create the ticket.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/support-tickets"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Tickets
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Create support ticket
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Record a request on behalf of a rider or driver.
        </p>
      </div>

      <form
        onSubmit={ handleSubmit }
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            Requester type
            <select
              value={ form.requesterType }
              onChange={ (event) =>
                updateField(
                  "requesterType",
                  event.target.value as SupportTicketRequesterType,
                )
              }
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="Rider">Rider</option>
              <option value="Driver">Driver</option>
            </select>
          </label>

          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            Requester ID
            <Input
              required
              value={ form.requesterId }
              onChange={ (event) => updateField("requesterId", event.target.value) }
              placeholder="Enter the rider or driver account ID"
              className="h-9"
            />
          </label>

          <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
            Subject
            <Input
              required
              maxLength={ 200 }
              value={ form.subject }
              onChange={ (event) => updateField("subject", event.target.value) }
              placeholder="Summarize the support issue"
              className="h-9"
            />
          </label>

          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            Category
            <select
              required
              value={ form.category }
              onChange={ (event) => updateField("category", event.target.value) }
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              { SUPPORT_TICKET_CATEGORIES.map((category) => (
                <option key={ category } value={ category }>
                  { category }
                </option>
              )) }
            </select>
          </label>

          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            Priority
            <select
              value={ form.priority }
              onChange={ (event) =>
                updateField("priority", event.target.value as SupportTicketPriority)
              }
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              { SUPPORT_TICKET_PRIORITIES.map((priority) => (
                <option key={ priority } value={ priority }>
                  { TICKET_PRIORITY_LABELS[priority] }
                </option>
              )) }
            </select>
          </label>

          <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
            Initial message
            <Textarea
              required
              rows={ 5 }
              maxLength={ 5000 }
              value={ form.message }
              onChange={ (event) => updateField("message", event.target.value) }
              placeholder="Describe the request and any relevant context"
              className="min-h-32 bg-white"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button asChild type="button" variant="outline" disabled={ isSubmitting }>
            <Link href="/support-tickets">Cancel</Link>
          </Button>
          <Button type="submit" disabled={ isSubmitting }>
            <Send className="size-3.5" aria-hidden="true" />
            { isSubmitting ? "Creating…" : "Create ticket" }
          </Button>
        </div>
      </form>
    </div>
  );
}

export default NewSupportTicketPage;
