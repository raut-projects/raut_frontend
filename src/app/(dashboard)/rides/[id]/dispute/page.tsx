"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Can } from "@/components/Can";
import { Button } from "@/components/ui/button";
import { useRideDispute, useResolveRideDispute } from "@/hooks/useRideDisputes";
import { PERMISSIONS } from "@/lib/permissions";
import { ResolveRideDisputeInput } from "@/lib/rideDisputes";
import ResolveDisputeForm from "@/components/rideDispute/ResolveDisputeForm";
import DisputeSummary from "@/components/rideDispute/DisputeSummary";

export default function ResolveDisputePage() {
  const { id } = useParams<{ id: string | string[] }>();
  const rideId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const { data: dispute, isPending, isError, error } = useRideDispute(rideId);
  const resolve = useResolveRideDispute();

  const handleResolve = async (input: ResolveRideDisputeInput) => {
    await resolve.mutateAsync({ rideId: String(rideId), input });
    router.push("/rides");
  };

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-10">
        <Link
          href="/rides"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" /> Back to rides
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Loading dispute…
        </h1>
      </div>
    );
  }

  if (isError || !dispute) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-10">
        <Link
          href="/rides"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" /> Back to rides
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Dispute unavailable
        </h1>
        <p className="text-sm text-slate-500">
          {(error as Error | null)?.message ??
            "No dispute was found for this ride."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/rides"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" /> Back to rides
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Resolve Dispute · {dispute.displayId}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Record the outcome of ride {dispute.rideId}.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        {dispute.status === "resolved" ? (
          <DisputeSummary
            dispute={dispute}
            onBack={() => router.push("/rides")}
          />
        ) : (
          <Can
            permission={PERMISSIONS.FINANCE_REFUNDS_ISSUE}
            fallback={
              <p className="text-sm text-slate-500">
                You do not have permission to issue refunds.
              </p>
            }
          >
            <ResolveDisputeForm
              dispute={dispute}
              onResolve={handleResolve}
              isPending={resolve.isPending}
            />
          </Can>
        )}
      </div>
    </div>
  );
}
