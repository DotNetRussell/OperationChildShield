"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { US_STATE_OPTIONS } from "@/lib/states";

const PARTY_OPTIONS = [
  { value: "", label: "All parties" },
  { value: "Democrat", label: "Democrat" },
  { value: "Republican", label: "Republican" },
  { value: "Independent", label: "Independent" },
] as const;

export function MemberFiltersBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeParty = searchParams.get("party") || "";
  const activeState = searchParams.get("state") || "";
  const hasFilters = Boolean(activeParty || activeState);

  function updateFilter(key: "party" | "state", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("offset");

    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `/?${qs}` : "/");
    });
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("party");
    params.delete("state");
    params.delete("offset");

    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `/?${qs}` : "/");
    });
  }

  return (
    <div className="mb-8">
      <p className="text-center text-sm font-semibold text-muted uppercase tracking-wider mb-3">
        Filter by Party &amp; State
      </p>
      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 max-w-[720px] mx-auto px-1">
        <label className="flex flex-col gap-1 min-w-[10rem] flex-1 sm:max-w-[14rem]">
          <span className="text-xs font-semibold text-muted px-1">Party</span>
          <select
            aria-label="Filter by party"
            value={activeParty}
            disabled={isPending}
            onChange={(e) => updateFilter("party", e.target.value)}
            className="rounded-xl border-2 border-card-border bg-surface px-3 py-2.5 text-sm font-medium text-foreground outline-none focus:border-blue disabled:opacity-60 cursor-pointer"
          >
            {PARTY_OPTIONS.map(({ value, label }) => (
              <option key={value || "all"} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 min-w-[10rem] flex-1 sm:max-w-[16rem]">
          <span className="text-xs font-semibold text-muted px-1">State</span>
          <select
            aria-label="Filter by state"
            value={activeState}
            disabled={isPending}
            onChange={(e) => updateFilter("state", e.target.value)}
            className="rounded-xl border-2 border-card-border bg-surface px-3 py-2.5 text-sm font-medium text-foreground outline-none focus:border-blue disabled:opacity-60 cursor-pointer"
          >
            <option value="">All states</option>
            {US_STATE_OPTIONS.map(({ name, code }) => (
              <option key={code} value={name}>
                {name} ({code})
              </option>
            ))}
          </select>
        </label>

        {hasFilters && (
          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-blue border-2 border-blue/30 bg-blue/5 hover:bg-blue/10 disabled:opacity-60 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      {isPending && (
        <p className="text-center text-sm text-muted mt-3 animate-pulse">Updating results...</p>
      )}
    </div>
  );
}