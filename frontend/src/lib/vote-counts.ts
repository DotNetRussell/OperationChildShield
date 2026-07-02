import type { MemberVote } from "./types";
import type { BillMetricsRow, MetricsVoteCounts } from "./metrics-types";

export interface YesNoCounts {
  yes: number;
  no: number;
}

export function isYesVote(voteCast: string): boolean {
  const v = voteCast.toLowerCase();
  return v === "aye" || v === "yea" || v === "yes";
}

export function isNoVote(voteCast: string): boolean {
  const v = voteCast.toLowerCase();
  return v === "nay" || v === "no";
}

/** Count yes/no floor votes for one member's tracked roll calls. */
export function countMemberYesNoVotes(votes: MemberVote[]): YesNoCounts {
  let yes = 0;
  let no = 0;

  for (const vote of votes) {
    if (isYesVote(vote.vote_cast)) yes += 1;
    else if (isNoVote(vote.vote_cast)) no += 1;
  }

  return { yes, no };
}

export function sumVoteCounts(counts: MetricsVoteCounts[]): MetricsVoteCounts {
  return counts.reduce(
    (acc, row) => ({
      yes: acc.yes + row.yes,
      no: acc.no + row.no,
      notVoting: acc.notVoting + row.notVoting,
      present: acc.present + row.present,
      unknown: acc.unknown + row.unknown,
    }),
    { yes: 0, no: 0, notVoting: 0, present: 0, unknown: 0 }
  );
}

export function aggregateRollCallVotes(bills: BillMetricsRow[]): MetricsVoteCounts {
  const active = bills.filter((bill) => bill.eligibleMembers > 0);
  return sumVoteCounts(active.map((bill) => bill.voteCounts));
}

export function aggregatePolicyVotes(bills: BillMetricsRow[]): {
  consistent: number;
  notConsistent: number;
} {
  return bills.reduce(
    (acc, bill) => ({
      consistent: acc.consistent + bill.policyConsistentVotes,
      notConsistent: acc.notConsistent + bill.policyNotConsistentVotes,
    }),
    { consistent: 0, notConsistent: 0 }
  );
}

export interface PieSegment {
  label: string;
  value: number;
  color: string;
}

export function segmentsFromCounts(
  entries: Array<{ label: string; value: number; color: string }>
): PieSegment[] {
  return entries.filter((entry) => entry.value > 0);
}