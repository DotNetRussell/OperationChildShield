import { StackedBarChart, type StackedBarRow } from "@/components/charts/StackedBarChart";
import { SimplePieChart, PieLegend } from "@/components/charts/SimplePieChart";
import {
  aggregatePolicyVotes,
  aggregateRollCallVotes,
  segmentsFromCounts,
} from "@/lib/vote-counts";
import type { BillMetricsRow } from "@/lib/metrics-types";

const VOTE_COLORS = {
  yes: "#16a34a",
  no: "#e11d48",
  notVoting: "#94a3b8",
  consistent: "#1d4ed8",
  notConsistent: "#b45309",
} as const;

interface MetricsChartsProps {
  bills: BillMetricsRow[];
}

export function MetricsCharts({ bills }: MetricsChartsProps) {
  const rollCalls = bills.filter((bill) => bill.eligibleMembers > 0);
  const rollCallTotals = aggregateRollCallVotes(bills);
  const policyTotals = aggregatePolicyVotes(rollCalls);

  const rollCallPie = segmentsFromCounts([
    { label: "Yes", value: rollCallTotals.yes, color: VOTE_COLORS.yes },
    { label: "No", value: rollCallTotals.no, color: VOTE_COLORS.no },
    {
      label: "Not Voting",
      value: rollCallTotals.notVoting,
      color: VOTE_COLORS.notVoting,
    },
  ]);

  const policyPie = segmentsFromCounts([
    {
      label: "Policy consistent",
      value: policyTotals.consistent,
      color: VOTE_COLORS.consistent,
    },
    {
      label: "Policy not consistent",
      value: policyTotals.notConsistent,
      color: VOTE_COLORS.notConsistent,
    },
  ]);

  const billBars: StackedBarRow[] = rollCalls.map((bill) => ({
    id: bill.billId,
    label: bill.billNumber,
    sublabel: bill.billTitle,
    segments: [
      { label: "Yes", value: bill.voteCounts.yes, color: VOTE_COLORS.yes },
      { label: "No", value: bill.voteCounts.no, color: VOTE_COLORS.no },
      {
        label: "Not Voting",
        value: bill.voteCounts.notVoting,
        color: VOTE_COLORS.notVoting,
      },
    ],
  }));

  if (rollCalls.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted">
        No House roll-call data is available yet for charting. Charts appear when
        tracked bills have recorded floor votes.
      </p>
    );
  }

  return (
    <section className="mt-10 space-y-8">
      <div>
        <h2 className="m-0 text-xl font-bold text-blue">Roll-Call Charts</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[10px] border border-card-border bg-surface p-5 shadow-sm">
          <h3 className="m-0 text-base font-bold text-blue">
            All Tracked Roll Calls: Vote Mix
          </h3>
          <p className="mt-1 text-sm text-muted">
            Combined Yes / No / Not Voting across every tracked bill with a House
            roll call.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <SimplePieChart
              segments={rollCallPie}
              size={140}
              ariaLabel="Congress-wide roll-call vote mix on tracked bills"
            />
            <PieLegend segments={rollCallPie} />
          </div>
        </div>

        <div className="rounded-[10px] border border-card-border bg-surface p-5 shadow-sm">
          <h3 className="m-0 text-base font-bold text-blue">
            Policy Consistency on Roll Calls
          </h3>
          <p className="mt-1 text-sm text-muted">
            Aggregate count of votes consistent or not consistent with board-adopted
            policy positions.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <SimplePieChart
              segments={policyPie}
              size={140}
              ariaLabel="Congress-wide policy consistency counts on tracked roll calls"
            />
            <PieLegend segments={policyPie} />
          </div>
        </div>
      </div>

      <div className="rounded-[10px] border border-card-border bg-surface p-5 shadow-sm">
        <h3 className="m-0 text-base font-bold text-blue">Per-Bill Roll-Call Breakdown</h3>
        <p className="mt-1 text-sm text-muted">
          Each bar shows how the House voted on that bill&apos;s tracked roll call.
        </p>
        <div className="mt-5">
          <StackedBarChart rows={billBars} />
        </div>
      </div>
    </section>
  );
}