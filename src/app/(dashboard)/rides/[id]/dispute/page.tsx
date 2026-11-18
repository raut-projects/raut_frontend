"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRideDispute, useResolveRideDispute } from "@/hooks/useRideDisputes";
import { ResolveRideDisputeInput } from "@/lib/rideDisputes";
import ResolveDisputeForm from "@/components/rideDispute/ResolveDisputeForm";
import DisputeSummary from "@/components/rideDispute/DisputeSummary";

export default function ResolveDisputePage() {
  const { id } = useParams<{ id: string | string[] }>();
  const rideId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const { data: dispute, isPending } = useRideDispute(rideId);
  const resolve = useResolveRideDispute();

  const handleResolve = async (input: ResolveRideDisputeInput) => {
    await resolve.mutateAsync({ rideId: String(rideId), input });
    router.push("/rides");
  };

  if (isPending || !dispute) {
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
          <ResolveDisputeForm
            dispute={dispute}
            onResolve={handleResolve}
            isPending={resolve.isPending}
          />
        )}
      </div>
    </div>
  );
}
