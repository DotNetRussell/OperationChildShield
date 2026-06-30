"use client";

import type { StateMetric } from "@/lib/metrics-types";
import { scoreBg } from "@/lib/metrics-utils";

interface StateHeatmapProps {
  states: StateMetric[];
}

export function StateHeatmap({ states }: StateHeatmapProps) {
  if (!states.length) {
    return <p className="text-sm text-muted">No state data for current filters.</p>;
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
      {states.map((state) => (
        <div
          key={state.state}
          title={`${state.state}: ${state.avgScore ?? "N/A"}% avg (${state.memberCount} members)`}
          className="group relative"
        >
          <div
            className={`aspect-square rounded-md flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow-sm ${scoreBg(state.avgScore)}`}
          >
            {state.stateCode || state.state.slice(0, 2)}
          </div>
          <div className="absolute z-10 hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-[10px] rounded whitespace-nowrap pointer-events-none">
            {state.state}: {state.avgScore ?? "N/A"}%
          </div>
        </div>
      ))}
    </div>
  );
}