import { SimplePieChart, PieLegend } from "@/components/charts/SimplePieChart";
import {
  countMemberYesNoVotes,
  segmentsFromCounts,
} from "@/lib/vote-counts";
import type { MemberVote } from "@/lib/types";

const YES_COLOR = "#16a34a";
const NO_COLOR = "#e11d48";

interface MemberVotePieChartProps {
  votes: MemberVote[];
  compact?: boolean;
}

export function MemberVotePieChart({ votes, compact = true }: MemberVotePieChartProps) {
  const { yes, no } = countMemberYesNoVotes(votes);
  const segments = segmentsFromCounts([
    { label: "Yes", value: yes, color: YES_COLOR },
    { label: "No", value: no, color: NO_COLOR },
  ]);

  if (segments.length === 0) return null;

  const size = compact ? 72 : 96;

  return (
    <div
      className="rounded-md border border-card-border bg-surface-muted px-3 py-2"
      title="How this official voted Yes or No on tracked roll calls"
    >
      <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-muted text-center">
        Yes vs No Votes
      </p>
      <div className="mt-2 flex items-center justify-center gap-3">
        <SimplePieChart
          segments={segments}
          size={size}
          ariaLabel={`Yes versus No votes on tracked roll calls: ${yes} yes, ${no} no`}
        />
        <PieLegend segments={segments} compact />
      </div>
    </div>
  );
}