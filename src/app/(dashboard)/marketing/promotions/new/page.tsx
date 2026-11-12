"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PromotionForm } from "@/components/marketing/PromotionForm";
import { useToast } from "@/components/toastContext";
import { useCreatePromotion } from "@/hooks/useMarketing";
import { usePageViewStore } from "@/store/pageViewStore";
import {
  derivePromotionStatus,
  type PromotionPayload,
} from "@/lib/marketing";

export default function NewPromotionPage() {
  const router = useRouter();
  const toast = useToast();
  const create = useCreatePromotion();

  const handleSubmit = async (payload: PromotionPayload) => {
    try {
      await create.mutateAsync(payload);
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
          ? "Promotion created."
          : "Promotion saved as a draft.",
      );
      router.push("/marketing/promotions");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not create the promotion.",
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
          Create promotion
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Set up a discount campaign for customers, then activate it immediately or
          save it as a draft.
        </p>
      </div>

      <PromotionForm
        mode="create"
        isSubmitting={ create.isPending }
        onSubmit={ handleSubmit }
        onCancel={ () => router.push("/marketing/promotions") }
      />
    </div>
  );
}
