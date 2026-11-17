"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { signOut } from "@/services/auth";

export default function AccessDenied() {
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ShieldAlert className="size-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Access denied
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          You do not have permission to open this section. Contact an
          administrator if you believe this is a mistake.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Sign out
          </button>
        </div>
      </section>
    </main>
  );
}
