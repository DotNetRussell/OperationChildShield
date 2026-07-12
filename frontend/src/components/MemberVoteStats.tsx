import { PolicyBadge } from "@/components/PolicyBadge";
import type { MemberVoteSummary } from "@/lib/format";

interface MemberVoteStatsProps {
  summary: MemberVoteSummary;
  compact?: boolean;
}

export function MemberVoteStats({ summary, compact = false }: MemberVoteStatsProps) {
  const badgeSize = compact ? "sm" : "md";
  const countClass = compact ? "text-base font-bold text-blue" : "text-2xl font-bold text-blue";

  return (
    <div
      className={
        compact
          ? "mb-3 grid w-full min-w-0 grid-cols-3 gap-1.5 sm:gap-2"
          : "mt-6 grid w-full min-w-0 grid-cols-3 gap-2 sm:gap-4 text-center"
      }
      aria-label="Voting record summary"
    >
      <div
        className={`flex flex-col items-center justify-center gap-1 rounded-md border border-card-border bg-surface-muted ${
          compact ? "px-1 py-2 min-h-[4.5rem]" : "rounded-lg p-4"
        }`}
        title="Recorded floor votes on tracked child protection bills"
      >
        <p className={`m-0 ${countClass}`}>{summary.recorded}</p>
        <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-muted">
          Votes
        </p>
      </div>

      <div
        className={`flex flex-col items-center justify-center gap-1 rounded-md border border-card-border bg-surface-muted ${
          compact ? "px-1 py-2 min-h-[4.5rem]" : "rounded-lg p-4"
        }`}
        title="Votes consistent with OCS board-adopted policy positions"
      >
        <PolicyBadge consistent size={badgeSize} />
        <p className={`m-0 ${countClass}`}>{summary.consistent}</p>
      </div>

      <div
        className={`flex flex-col items-center justify-center gap-1 rounded-md border border-card-border bg-surface-muted ${
          compact ? "px-1 py-2 min-h-[4.5rem]" : "rounded-lg p-4"
        }`}
        title="Votes not consistent with OCS board-adopted policy positions"
      >
        <PolicyBadge consistent={false} size={badgeSize} />
        <p className={`m-0 ${countClass}`}>{summary.notConsistent}</p>
      </div>
    </div>
  );
}