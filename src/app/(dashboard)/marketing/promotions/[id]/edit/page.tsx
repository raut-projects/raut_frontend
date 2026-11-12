"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PromotionForm } from "@/components/marketing/PromotionForm";
import { QueryError } from "@/components/queryStates";
import { useToast } from "@/components/toastContext";
import { Skeleton } from "@/components/ui/skeleton";
import { usePromotion, useUpdatePromotion } from "@/hooks/useMarketing";
import {
  derivePromotionStatus,
  promotionToFormValues,
  type PromotionPayload,
} from "@/lib/marketing";
import { usePageViewStore } from "@/store/pageViewStore";

export default function EditPromotionPage() {
  const params = useParams<{ id: string }>();
  const promotionId = String(params?.id ?? "");
  const router = useRouter();
  const toast = useToast();
  const query = usePromotion(promotionId);
  const update = useUpdatePromotion(promotionId);

  const handleSubmit = async (payload: PromotionPayload) => {
    try {
      await update.mutateAsync(payload);
      usePageViewStore
        .getState()
        .setField(
          "marketingPromotions",
          "status",
          derivePromotionStatus({
            isActive: payload.is_active,
            startsAt: payload.start_date,
            endsAt: payload.end_date,
          }),
        );
      usePageViewStore.getState().setField("marketingPromotions", "page", 1);
      toast.success(
        payload.is_active
          ? "Promotion updated."
          : "Promotion saved as a draft.",
      );
      router.push("/marketing/promotions");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update the promotion.",
      );
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Link
          href="/marketing/promotions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to promotions
        </Link>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Edit promotion
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          { query.data
            ? `Update ${query.data.code} · ${query.data.name}.`
            : "Update the campaign details and save your changes." }
        </p>
      </div>

      { query.isPending ? (
        <div className="space-y-4">
          { Array.from({ length: 3 }, (_, index) => (
            <div
              key={ index }
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-card"
            >
              <Skeleton className="h-4 w-40 bg-slate-200" />
              <div className="grid gap-4 sm:grid-cols-2">
                { Array.from({ length: 4 }, (_, field) => (
                  <div key={ field } className="space-y-2">
                    <Skeleton className="h-3 w-24 bg-slate-200" />
                    <Skeleton className="h-10 w-full bg-slate-100" />
                  </div>
                )) }
              </div>
            </div>
          )) }
        </div>
      ) : query.isError ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-card">
          <QueryError error={ query.error } onRetry={ query.refetch } />
        </div>
      ) : query.data ? (
        <PromotionForm
          key={ query.data.id }
          mode="edit"
          initialValues={ promotionToFormValues(query.data) }
          initialIsActive={ query.data.isActive }
          isSubmitting={ update.isPending }
          onSubmit={ handleSubmit }
          onCancel={ () => router.push("/marketing/promotions") }
        />
      ) : null }
    </div>
  );
}
