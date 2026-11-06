"use client";

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export function ConfigCard({
  title,
  description,
  action,
  children,
  footer,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card",
        className,
      )}
    >
      {(title || description || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      <div className="px-5 py-5">{children}</div>
      {footer && (
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
          {footer}
        </div>
      )}
    </section>
  );
}

export function ConfigField({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold text-slate-600"
      >
        {label}
      </Label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function TabActions({
  dirty,
  isSaving,
  onSave,
  onReset,
  saveLabel = "Save changes",
}: {
  dirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
      <p className="text-xs text-slate-500">
        {isSaving
          ? "Saving configuration…"
          : dirty
            ? "You have unsaved changes."
            : "All changes saved."}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={!dirty || isSaving}
          className="h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Discard
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={!dirty || isSaving}
          className="h-9 bg-brand-600 px-3.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {isSaving ? (
            <>
              <LoaderCircle className="animate-spin" />
              Saving…
            </>
          ) : (
            saveLabel
          )}
        </Button>
      </div>
    </div>
  );
}

export function ConfigSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3 w-24 bg-slate-200" />
          <Skeleton className="h-10 w-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
