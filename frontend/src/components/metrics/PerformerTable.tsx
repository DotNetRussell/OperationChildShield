"use client";

import Link from "next/link";
import { formatDisplayName } from "@/lib/format";
import type { MetricsPerformer } from "@/lib/metrics-types";
import { scoreColor } from "@/lib/metrics-utils";

interface PerformerTableProps {
  rows: MetricsPerformer[];
  showNotVoting?: boolean;
  compact?: boolean;
}

export function PerformerTable({
  rows,
  showNotVoting = false,
  compact = false,
}: PerformerTableProps) {
  if (!rows.length) {
    return <p className="text-sm text-muted">No members match the current filters.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-card-border text-left text-muted">
            <th className="py-2 pr-3 font-semibold">Member</th>
            <th className="py-2 pr-3 font-semibold">Party</th>
            <th className="py-2 pr-3 font-semibold">State</th>
            <th className="py-2 pr-3 font-semibold text-right">Score</th>
            {showNotVoting && (
              <th className="py-2 font-semibold text-right">NV Rate</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.bioguideId} className="border-b border-card-border/60">
              <td className={`py-2 pr-3 ${compact ? "max-w-[10rem]" : ""}`}>
                <Link
                  href={`/member/${row.bioguideId}`}
                  className="font-medium text-blue hover:underline"
                >
                  {formatDisplayName(row.name)}
                </Link>
              </td>
              <td className="py-2 pr-3 text-muted">{row.party}</td>
              <td className="py-2 pr-3 text-muted">{row.stateCode || row.state}</td>
              <td className={`py-2 pr-3 text-right font-semibold tabular-nums ${scoreColor(row.scorePercent)}`}>
                {row.letterGrade} ({row.scorePercent}%)
              </td>
              {showNotVoting && (
                <td className="py-2 text-right tabular-nums text-red">
                  {row.notVotingRate ?? 0}%
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}