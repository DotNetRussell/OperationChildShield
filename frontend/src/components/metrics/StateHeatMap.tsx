"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { StateMetric } from "@/lib/metrics-types";
import {
  formatConsistencyRate,
  heatColorForRate,
  heatTextClass,
  indexStateMetrics,
} from "@/lib/state-metrics";
import { US_HEATMAP_LAYOUT } from "@/lib/states";

interface StateHeatMapProps {
  byState: StateMetric[];
}

export function StateHeatMap({ byState }: StateHeatMapProps) {
  const byCode = useMemo(() => indexStateMetrics(byState), [byState]);
  const [focused, setFocused] = useState<string | null>(null);

  const focusedMetric = focused ? byCode.get(focused) : null;

  return (
    <div className="rounded-[10px] border border-card-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-xl font-bold text-blue">Where Does Your State Stand?</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted leading-relaxed">
            Color shows how often House members from each state voted with
            Operation Child Shield policy on tracked child safety bills. Click
            any state to dig in.
          </p>
        </div>
        <div className="text-xs text-muted space-y-1 min-w-[10rem]" aria-hidden>
          <p className="m-0 font-semibold uppercase tracking-wide">Legend</p>
          <LegendSwatch color="#1e3a5f" label="80-100%" />
          <LegendSwatch color="#2563eb" label="60-79%" />
          <LegendSwatch color="#d97706" label="40-59%" />
          <LegendSwatch color="#ea580c" label="20-39%" />
          <LegendSwatch color="#b91c1c" label="0-19%" />
          <LegendSwatch color="#94a3b8" label="No recorded votes" />
        </div>
      </div>

      <div
        className="mt-6 flex justify-center overflow-x-auto"
        role="group"
        aria-label="United States heat map by policy consistency"
      >
        <div
          className="inline-grid gap-1 min-w-[36rem] w-full max-w-3xl"
          style={{ gridTemplateColumns: "repeat(11, minmax(0, 1fr))" }}
        >
          {US_HEATMAP_LAYOUT.flatMap((row, rowIndex) =>
            row.map((code, colIndex) => {
              if (!code) {
                return (
                  <div
                    key={`empty-${rowIndex}-${colIndex}`}
                    className="h-9 sm:h-10"
                    aria-hidden
                  />
                );
              }

              const metric = byCode.get(code);
              const rate = metric?.policyConsistencyRate ?? null;
              const label = metric
                ? `${metric.state}: ${formatConsistencyRate(rate)}; ${metric.recordedVotes} recorded votes`
                : `${code}: No data`;

              return (
                <Link
                  key={code}
                  href={`/states/${code.toLowerCase()}`}
                  title={label}
                  aria-label={label}
                  onFocus={() => setFocused(code)}
                  onBlur={() => setFocused((c) => (c === code ? null : c))}
                  onMouseEnter={() => setFocused(code)}
                  onMouseLeave={() => setFocused((c) => (c === code ? null : c))}
                  className={`flex h-9 sm:h-10 items-center justify-center rounded-md text-[0.7rem] sm:text-xs font-bold no-underline transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue ${heatTextClass(rate)}`}
                  style={{ backgroundColor: heatColorForRate(rate) }}
                >
                  {code}
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div
        className="mt-4 min-h-[3.5rem] rounded-md border border-card-border bg-surface-muted px-4 py-3 text-sm text-muted"
        aria-live="polite"
      >
        {focusedMetric ? (
          <>
            <strong className="text-foreground">{focusedMetric.state}</strong>
            {" · "}
            {formatConsistencyRate(focusedMetric.policyConsistencyRate)}
            {" · "}
            {focusedMetric.policyConsistentVotes} consistent /{" "}
            {focusedMetric.policyNotConsistentVotes} not consistent
            {" · "}
            {focusedMetric.houseMembersWithRecordedVotes} House members with
            recorded votes
          </>
        ) : (
          <span>Hover or focus a state to preview figures. Click to open the state page.</span>
        )}
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-3 w-5 rounded-sm border border-black/10"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}
