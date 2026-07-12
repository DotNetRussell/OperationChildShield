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

const COLS = 11;

export function StateHeatMap({ byState }: StateHeatMapProps) {
  const byCode = useMemo(() => indexStateMetrics(byState), [byState]);
  const [focused, setFocused] = useState<string | null>(null);

  const focusedMetric = focused ? byCode.get(focused) : null;

  return (
    <div className="box-border w-full max-w-full min-w-0 overflow-hidden rounded-[10px] border border-card-border bg-surface p-3 shadow-sm sm:p-5">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="m-0 text-lg font-bold text-blue sm:text-xl">
            Where Does Your State Stand?
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted leading-relaxed">
            Color shows how often House members from each state voted with
            Operation Child Shield policy on tracked child safety bills. Tap a
            state for details.
          </p>
        </div>
        <div
          className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-muted sm:min-w-[10rem] sm:flex-col sm:flex-nowrap sm:gap-0 sm:space-y-1"
          aria-hidden
        >
          <p className="m-0 w-full font-semibold uppercase tracking-wide sm:w-auto">
            Legend
          </p>
          <LegendSwatch color="#1e3a5f" label="80-100%" />
          <LegendSwatch color="#2563eb" label="60-79%" />
          <LegendSwatch color="#d97706" label="40-59%" />
          <LegendSwatch color="#ea580c" label="20-39%" />
          <LegendSwatch color="#b91c1c" label="0-19%" />
          <LegendSwatch color="#94a3b8" label="No recorded votes" />
        </div>
      </div>

      {/*
        Fit the 11-column map to the card width. No fixed min-width, no flex
        centering, no negative margins — cells stay inside the card on mobile.
      */}
      <div
        className="mt-4 box-border w-full max-w-full min-w-0 overflow-hidden rounded-md border border-card-border bg-surface-muted/40 p-1.5 sm:p-2"
        role="group"
        aria-label="United States heat map by policy consistency"
      >
        <div
          className="grid w-full max-w-full gap-0.5 sm:gap-1"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          }}
        >
          {US_HEATMAP_LAYOUT.flatMap((row, rowIndex) =>
            row.map((code, colIndex) => {
              if (!code) {
                return (
                  <div
                    key={`empty-${rowIndex}-${colIndex}`}
                    className="aspect-square min-w-0 min-h-0"
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
                  className={`box-border flex aspect-square min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-[3px] text-[0.55rem] font-bold leading-none no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-1 sm:rounded-md sm:text-xs ${heatTextClass(rate)}`}
                  style={{ backgroundColor: heatColorForRate(rate) }}
                >
                  <span className="block max-w-full truncate px-0.5">{code}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div
        className="mt-4 min-h-[3.5rem] break-words rounded-md border border-card-border bg-surface-muted px-3 py-3 text-sm text-muted sm:px-4"
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
          <span>Tap a state to preview figures, then open the full state page.</span>
        )}
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className="inline-block h-3 w-5 shrink-0 rounded-sm border border-black/10"
        style={{ backgroundColor: color }}
      />
      <span className="min-w-0">{label}</span>
    </div>
  );
}
