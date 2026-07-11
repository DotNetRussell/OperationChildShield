import type { StateMetric } from "./metrics-types";

/** Color for policy-consistency heat map cells (colorblind-friendlier ramp). */
export function heatColorForRate(rate: number | null | undefined): string {
  if (rate == null || Number.isNaN(rate)) {
    return "var(--heat-empty, #94a3b8)";
  }
  if (rate >= 80) return "#1e3a5f";
  if (rate >= 60) return "#2563eb";
  if (rate >= 40) return "#d97706";
  if (rate >= 20) return "#ea580c";
  return "#b91c1c";
}

export function heatTextClass(rate: number | null | undefined): string {
  if (rate == null || Number.isNaN(rate)) return "text-slate-800";
  if (rate >= 60) return "text-white";
  return "text-white";
}

export function formatConsistencyRate(rate: number | null | undefined): string {
  if (rate == null || Number.isNaN(rate)) return "No recorded votes";
  return `${rate.toFixed(1)}% policy-consistent`;
}

export function indexStateMetrics(rows: StateMetric[]): Map<string, StateMetric> {
  const map = new Map<string, StateMetric>();
  for (const row of rows) {
    if (row.stateCode) {
      map.set(row.stateCode.toUpperCase(), row);
    }
  }
  return map;
}

/** States with recorded votes, sorted by consistency rate desc (ties by name). */
export function statesWithRecordedVotes(rows: StateMetric[]): StateMetric[] {
  return [...rows]
    .filter((r) => r.recordedVotes > 0 && r.policyConsistencyRate != null)
    .sort((a, b) => {
      const rateDiff = (b.policyConsistencyRate ?? 0) - (a.policyConsistencyRate ?? 0);
      if (rateDiff !== 0) return rateDiff;
      return a.state.localeCompare(b.state);
    });
}
