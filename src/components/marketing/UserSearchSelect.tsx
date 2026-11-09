"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useReferralUserSearch } from "@/hooks/useMarketing";
import {
  REFERRAL_USER_TYPE_LABELS,
  type ReferralAssignableUser,
  type ReferralUserType,
} from "@/lib/referralCodes";

export function UserSearchSelect({
  selectedUser,
  onSelect,
  userType,
  error,
}: {
  selectedUser: ReferralAssignableUser | null;
  onSelect: (user: ReferralAssignableUser | null) => void;
  userType: ReferralUserType;
  error?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 250);
  const search = useReferralUserSearch(debouncedQuery, userType);
  const results = search.data ?? [];
  const canSearch = debouncedQuery.trim().length >= 2;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);

    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const choose = (user: ReferralAssignableUser | null) => {
    onSelect(user);
    setOpen(false);

    if (!user) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  if (selectedUser) {
    return (
      <div>
        <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-brand-700 shadow-sm">
            {selectedUser.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {selectedUser.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {selectedUser.email || selectedUser.phone || "No contact details"}
              {" · "}
              {REFERRAL_USER_TYPE_LABELS[selectedUser.userType]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => choose(null)}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
            aria-label="Change assigned user"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        {error && (
          <span className="mt-1 block text-xs font-medium text-rose-600">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        {search.isFetching && (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-400"
            aria-hidden="true"
          />
        )}
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={`Search ${REFERRAL_USER_TYPE_LABELS[
            userType
          ].toLowerCase()}s by name, email or phone`}
          aria-label="Search for a rider or driver"
          aria-expanded={open}
          aria-controls="referral-user-results"
          className="h-10 bg-white pl-9"
        />
      </div>

      {open && (
        <div
          id="referral-user-results"
          className="absolute z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-elevated"
        >
          {!canSearch ? (
            <p className="px-3 py-2 text-xs text-slate-500">
              Type at least 2 characters to search.
            </p>
          ) : search.isPending ? (
            <p className="px-3 py-2 text-xs text-slate-500">Searching…</p>
          ) : search.isError ? (
            <p className="px-3 py-2 text-xs font-medium text-rose-600">
              {search.error instanceof Error
                ? search.error.message
                : "Could not search users."}
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">
              No {REFERRAL_USER_TYPE_LABELS[userType].toLowerCase()} found.
            </p>
          ) : (
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => choose(user)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                  {user.name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {user.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {user.email || user.phone || user.id}
                  </span>
                </span>
                <Check className="size-3.5 shrink-0 text-brand-600" />
              </button>
            ))
          )}
        </div>
      )}

      {error && (
        <span className="mt-1 block text-xs font-medium text-rose-600">
          {error}
        </span>
      )}
    </div>
  );
}
