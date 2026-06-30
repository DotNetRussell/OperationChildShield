"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getMetricsExportUrl } from "@/lib/api";
import type { MetricsDashboardData, MetricsFilters } from "@/lib/metrics-types";
import { DEFAULT_METRICS_FILTERS } from "@/lib/metrics-types";
import {
  billInsightRows,
  computeFilteredView,
  formatPercent,
  scoreColor,
} from "@/lib/metrics-utils";
import { ChartBars } from "./ChartBars";
import { PerformerTable } from "./PerformerTable";
import { StateHeatmap } from "./StateHeatmap";

const GRADE_COLORS: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-yellow-500",
  C: "bg-orange-500",
  D: "bg-orange-600",
  F: "bg-red-500",
  "N/A": "bg-slate-400",
};

interface MetricsDashboardProps {
  data: MetricsDashboardData;
}

function SectionCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-surface rounded-xl border border-card-border shadow-sm p-5 sm:p-6">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted leading-relaxed">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  tone = "neutral",
  sub,
}: {
  label: string;
  value: string;
  tone?: "strong" | "weak" | "neutral";
  sub?: string;
}) {
  const toneClass =
    tone === "strong"
      ? "kpi-strong border-green-200 bg-green-50"
      : tone === "weak"
        ? "kpi-weak border-red-200 bg-red-50"
        : "border-card-border bg-surface-muted";

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl sm:text-3xl font-bold tabular-nums text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function ScatterPlot({
  points,
}: {
  points: { bioguideId: string; name: string; scorePercent: number; missedVotes: number }[];
}) {
  const maxMissed = Math.max(...points.map((p) => p.missedVotes), 1);

  return (
    <div className="relative h-56 border border-card-border rounded-lg bg-surface-muted p-4">
      <div className="absolute left-2 top-2 text-[10px] text-muted">100%</div>
      <div className="absolute left-2 bottom-2 text-[10px] text-muted">0%</div>
      <div className="absolute right-2 bottom-2 text-[10px] text-muted">Missed votes →</div>
      <div className="relative h-full w-full">
        {points.map((p) => (
          <div
            key={p.bioguideId}
            title={`${p.name}: ${p.scorePercent}% score, ${p.missedVotes} missed`}
            className="absolute w-2.5 h-2.5 rounded-full bg-blue/70 hover:bg-blue cursor-default -translate-x-1/2 translate-y-1/2"
            style={{
              left: `${(p.missedVotes / maxMissed) * 92 + 4}%`,
              bottom: `${p.scorePercent}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function MetricsDashboard({ data }: MetricsDashboardProps) {
  const [filters, setFilters] = useState<MetricsFilters>(DEFAULT_METRICS_FILTERS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [stateSort, setStateSort] = useState<"score" | "name">("score");

  const view = useMemo(() => computeFilteredView(data, filters), [data, filters]);
  const bills = useMemo(() => billInsightRows(view.billInsights), [view.billInsights]);

  const sortedStates = useMemo(() => {
    const rows = [...view.byState];
    if (stateSort === "name") {
      rows.sort((a, b) => a.state.localeCompare(b.state));
    }
    return rows;
  }, [view.byState, stateSort]);

  const hasFilters = Object.values(filters).some(Boolean);
  const lastUpdated = new Date(data.lastUpdated).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const avgScore = view.kpis.avgProtectionScore;
  const kpiTone = avgScore == null ? "neutral" : avgScore >= 70 ? "strong" : avgScore < 60 ? "weak" : "neutral";

  const gradeBars = Object.entries(view.scoreDistribution.gradeBuckets).map(([grade, stat]) => ({
    label: grade,
    value: stat.count,
    displayValue: `${stat.count} (${stat.percent}%)`,
    colorClass: GRADE_COLORS[grade] || "bg-blue",
  }));

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-surface rounded-xl border border-card-border shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Metrics Dashboard</h1>
            <p className="mt-1 text-sm text-muted max-w-3xl">
              {data.scoringNote}
            </p>
            <p className="mt-2 text-xs text-muted">
              Last updated {lastUpdated} · Data from {data.dataSource} · {data.congress}th Congress
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={getMetricsExportUrl()}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-blue text-white hover:bg-blue-light no-underline"
            >
              Download CSV
            </a>
            <Link
              href="/about"
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border border-card-border text-foreground hover:bg-surface-muted no-underline"
            >
              Methodology
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            aria-label="Filter by chamber"
            value={filters.chamber}
            onChange={(e) => setFilters((f) => ({ ...f, chamber: e.target.value }))}
            className="rounded-lg border border-card-border px-3 py-2 text-sm bg-surface"
          >
            <option value="">All chambers</option>
            {data.filterOptions.chambers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Filter by party"
            value={filters.party}
            onChange={(e) => setFilters((f) => ({ ...f, party: e.target.value }))}
            className="rounded-lg border border-card-border px-3 py-2 text-sm bg-surface"
          >
            <option value="">All parties</option>
            {data.filterOptions.parties.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            aria-label="Filter by state"
            value={filters.state}
            onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}
            className="rounded-lg border border-card-border px-3 py-2 text-sm bg-surface"
          >
            <option value="">All states</option>
            {data.filterOptions.states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Filter by region"
            value={filters.region}
            onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
            className="rounded-lg border border-card-border px-3 py-2 text-sm bg-surface"
          >
            <option value="">All regions</option>
            {data.filterOptions.regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            aria-label="Filter by seniority"
            value={filters.seniority}
            onChange={(e) => setFilters((f) => ({ ...f, seniority: e.target.value }))}
            className="rounded-lg border border-card-border px-3 py-2 text-sm bg-surface"
          >
            <option value="">All seniority</option>
            {data.filterOptions.seniorityBuckets.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Filter by grade"
            value={filters.grade}
            onChange={(e) => setFilters((f) => ({ ...f, grade: e.target.value }))}
            className="rounded-lg border border-card-border px-3 py-2 text-sm bg-surface"
          >
            <option value="">All grades</option>
            {data.filterOptions.gradeBuckets.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_METRICS_FILTERS)}
            className="mt-3 text-sm font-semibold text-blue hover:underline"
          >
            Clear all filters ({view.members.length} members shown)
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          label="Avg Protection Score"
          value={formatPercent(avgScore)}
          tone={kpiTone}
          sub={`${view.kpis.houseMembersScored} House members scored`}
        />
        <KpiCard
          label="Members Tracked"
          value={String(view.kpis.totalMembersTracked)}
        />
        <KpiCard
          label="Bills Tracked"
          value={String(view.kpis.totalBillsTracked)}
          sub={`${view.kpis.totalBillsScored} with roll-call votes`}
        />
        <KpiCard
          label="Avg Participation"
          value={formatPercent(view.kpis.avgParticipationRate)}
          tone={
            (view.kpis.avgParticipationRate ?? 0) >= 90
              ? "strong"
              : (view.kpis.avgParticipationRate ?? 100) < 75
                ? "weak"
                : "neutral"
          }
        />
        <KpiCard
          label="Passing Grades (C+)"
          value={formatPercent(view.kpis.passingGradePercent)}
          tone={(view.kpis.passingGradePercent ?? 0) >= 50 ? "strong" : "weak"}
        />
        <KpiCard
          label="Not Voting Instances"
          value={String(view.kpis.totalNotVotingInstances)}
          tone={view.kpis.totalNotVotingInstances > 0 ? "weak" : "strong"}
        />
      </div>

      {/* Score Distribution */}
      <SectionCard
        id="distribution"
        title="Score Distribution"
        description="How Protection Scores are spread across the filtered House delegation."
      >
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-muted mb-3">Letter grades</h3>
            <ChartBars items={gradeBars} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted mb-3">Score histogram</h3>
            <ChartBars
              horizontal={false}
              items={view.scoreDistribution.histogram.map((b) => ({
                label: b.label,
                value: b.count,
                colorClass: "bg-blue-light",
              }))}
            />
            <div className="mt-4 flex gap-6 text-sm">
              <span>
                Mean:{" "}
                <strong className={scoreColor(view.scoreDistribution.mean)}>
                  {formatPercent(view.scoreDistribution.mean)}
                </strong>
              </span>
              <span>
                Median:{" "}
                <strong className={scoreColor(view.scoreDistribution.median)}>
                  {formatPercent(view.scoreDistribution.median)}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* By Party */}
      <SectionCard
        id="party"
        title="Breakdown by Party"
        description="Average scores, participation, and grade mix for each party."
      >
        <div className="grid lg:grid-cols-2 gap-6">
          <ChartBars
            items={view.byParty.map((p) => ({
              label: p.party,
              value: p.avgScore ?? 0,
              displayValue: formatPercent(p.avgScore),
              colorClass:
                p.party === "Democrat"
                  ? "bg-blue"
                  : p.party === "Republican"
                    ? "bg-red"
                    : "bg-purple-500",
            }))}
          />
          <div className="space-y-4">
            {view.byParty.map((party) => (
              <div key={party.party} className="border border-card-border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{party.party}</h3>
                  <span className="text-sm text-muted">{party.memberCount} members</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries(party.gradeDistribution).map(([g, stat]) =>
                    stat.count > 0 ? (
                      <span
                        key={g}
                        className="px-2 py-0.5 rounded-full bg-surface-subtle text-muted"
                      >
                        {g}: {stat.count}
                      </span>
                    ) : null
                  )}
                </div>
                <p className="mt-2 text-xs text-muted">
                  Participation {formatPercent(party.participationRate)} ·{" "}
                  {party.notVotingInstances} not-voting instances
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          {view.byParty.map((party) => (
            <div key={`${party.party}-tables`}>
              <h3 className="font-semibold mb-2">{party.party} — top & bottom</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted mb-1">Top 5</p>
                  <PerformerTable rows={party.topPerformers} compact />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted mb-1">Bottom 5</p>
                  <PerformerTable rows={party.bottomPerformers} compact />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* By Chamber */}
      <SectionCard id="chamber" title="Breakdown by Chamber">
        <div className="grid sm:grid-cols-2 gap-4">
          {view.byChamber.map((ch) => (
            <div key={ch.chamber} className="border border-card-border rounded-lg p-4">
              <h3 className="text-lg font-bold">{ch.chamber}</h3>
              <p className="text-sm text-muted mt-1">{ch.memberCount} members · {ch.scoredCount} scored</p>
              <p className={`mt-3 text-3xl font-bold tabular-nums ${scoreColor(ch.avgScore)}`}>
                {formatPercent(ch.avgScore)}
              </p>
              <p className="text-sm text-muted mt-1">
                Participation {formatPercent(ch.participationRate)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(ch.gradeDistribution).map(([g, stat]) =>
                  stat.count > 0 ? (
                    <span key={g} className={`text-xs px-2 py-1 rounded text-white ${GRADE_COLORS[g]}`}>
                      {g}: {stat.count}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Geographic */}
      <SectionCard
        id="geographic"
        title="Geographic Breakdown"
        description="State and regional averages for House members. Hover states for details."
      >
        <StateHeatmap states={view.byState} />

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Top 5 states</h3>
            <ChartBars
              items={view.stateRankings.top5.map((s) => ({
                label: s.stateCode || s.state,
                value: s.avgScore ?? 0,
                displayValue: formatPercent(s.avgScore),
                colorClass: "bg-green-500",
              }))}
            />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Bottom 5 states</h3>
            <ChartBars
              items={view.stateRankings.bottom5.map((s) => ({
                label: s.stateCode || s.state,
                value: s.avgScore ?? 0,
                displayValue: formatPercent(s.avgScore),
                colorClass: "bg-red-500",
              }))}
            />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Regional comparison</h3>
          <ChartBars
            items={view.byRegion.map((r) => ({
              label: r.region,
              value: r.avgScore ?? 0,
              displayValue: formatPercent(r.avgScore),
              colorClass: "bg-blue-light",
            }))}
          />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">All states</h3>
            <select
              aria-label="Sort states"
              value={stateSort}
              onChange={(e) => setStateSort(e.target.value as "score" | "name")}
              className="rounded border border-card-border px-2 py-1 text-sm"
            >
              <option value="score">Sort by score</option>
              <option value="name">Sort by name</option>
            </select>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-card-border text-left text-muted">
                  <th className="py-2 pr-3">Rank</th>
                  <th className="py-2 pr-3">State</th>
                  <th className="py-2 pr-3 text-right">Avg Score</th>
                  <th className="py-2 pr-3 text-right">Passing %</th>
                  <th className="py-2 text-right">Members</th>
                </tr>
              </thead>
              <tbody>
                {sortedStates.map((s) => (
                  <tr key={s.state} className="border-b border-card-border/60">
                    <td className="py-2 pr-3 text-muted">#{s.rank}</td>
                    <td className="py-2 pr-3 font-medium">{s.state}</td>
                    <td className={`py-2 pr-3 text-right font-semibold ${scoreColor(s.avgScore)}`}>
                      {formatPercent(s.avgScore)}
                    </td>
                    <td className="py-2 pr-3 text-right">{s.passingPercent}%</td>
                    <td className="py-2 text-right">{s.memberCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      {/* Seniority */}
      <SectionCard id="seniority" title="Seniority & Experience">
        <ChartBars
          items={view.bySeniority.map((s) => ({
            label: s.bucket,
            value: s.avgScore ?? 0,
            displayValue: `${formatPercent(s.avgScore)} · ${s.memberCount} members`,
            colorClass: "bg-blue",
          }))}
        />
        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="border-b border-card-border text-left text-muted">
              <th className="py-2 pr-3">Seniority</th>
              <th className="py-2 pr-3 text-right">Members</th>
              <th className="py-2 pr-3 text-right">Avg Score</th>
              <th className="py-2 text-right">Participation</th>
            </tr>
          </thead>
          <tbody>
            {view.bySeniority.map((s) => (
              <tr key={s.bucket} className="border-b border-card-border/60">
                <td className="py-2 pr-3">{s.bucket}</td>
                <td className="py-2 pr-3 text-right">{s.memberCount}</td>
                <td className={`py-2 pr-3 text-right font-semibold ${scoreColor(s.avgScore)}`}>
                  {formatPercent(s.avgScore)}
                </td>
                <td className="py-2 text-right">{formatPercent(s.participationRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      {/* Non-Voting */}
      <SectionCard
        id="non-voting"
        title="Non-Voting & Participation Analysis"
        description="Missed roll-call votes on scored child-protection bills reduce Protection Scores."
      >
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <KpiCard
            label="Overall NV Rate"
            value={formatPercent(view.nonVoting.overallNotVotingRate)}
            tone={view.nonVoting.overallNotVotingRate > 10 ? "weak" : "neutral"}
          />
          <KpiCard
            label="Avg Missed / Member"
            value={String(view.nonVoting.avgMissedVotesPerMember)}
          />
          <KpiCard
            label="Total NV Instances"
            value={String(view.nonVoting.totalNotVotingInstances)}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Score vs. missed votes</h3>
            <ScatterPlot points={view.nonVoting.scoreVsMissedVotes} />
            <p className="text-xs text-muted mt-2">
              Each dot is a House member. Higher missed votes tend to correlate with lower scores.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Highest non-vote rates by member</h3>
            <PerformerTable rows={view.nonVoting.topMembersByMissedVotes} showNotVoting />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Bills with highest not-voting rates</h3>
          <ChartBars
            items={view.nonVoting.billsHighestNotVoting.slice(0, 5).map((b) => ({
              label: b.billNumber,
              value: b.notVotingRate,
              displayValue: `${b.notVotingRate}%`,
              colorClass: "bg-red-500",
            }))}
          />
        </div>
      </SectionCard>

      {/* Top & Bottom */}
      <SectionCard id="performers" title="Top & Bottom Performers">
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2 text-green-700">Top 10 highest scores</h3>
            <PerformerTable rows={view.performers.top10} />
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-red">Bottom 10 lowest scores</h3>
            <PerformerTable rows={view.performers.bottom10} />
          </div>
        </div>
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Near-perfect scores (97%+)</h3>
            <PerformerTable rows={view.performers.nearPerfectScores} compact />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Perfect participation</h3>
            <PerformerTable rows={view.performers.perfectParticipation} compact />
          </div>
        </div>
      </SectionCard>

      {/* Bill Insights */}
      <SectionCard
        id="bills"
        title="Bill-Level Insights"
        description="Participation and bipartisan support on each scored roll-call bill."
      >
        <ChartBars
          items={bills.map((b) => ({
            label: b.billNumber,
            value: b.participationRate,
            displayValue: `${b.participationRate}%`,
            colorClass: "bg-blue-light",
          }))}
        />
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-muted">
                <th className="py-2 pr-3">Bill</th>
                <th className="py-2 pr-3 text-right">Participation</th>
                <th className="py-2 pr-3 text-right">NV Rate</th>
                <th className="py-2 pr-3 text-right">Protection %</th>
                <th className="py-2 pr-3 text-right">Bipartisan</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.billId} className="border-b border-card-border/60">
                  <td className="py-2 pr-3">
                    <a
                      href={b.congressUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue hover:underline"
                    >
                      {b.billNumber}
                    </a>
                    <p className="text-xs text-muted line-clamp-1">{b.billTitle}</p>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{b.participationRate}%</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-red">{b.notVotingRate}%</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{b.protectionVoteRate}%</td>
                  <td className="py-2 text-right tabular-nums">
                    {b.bipartisanSupport != null ? `${b.bipartisanSupport}%` : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Advanced */}
      <section className="bg-surface rounded-xl border border-card-border shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-surface-muted"
        >
          <div>
            <h2 className="text-xl font-bold text-foreground">Advanced Correlations</h2>
            <p className="text-sm text-muted mt-1">
              Optional deeper metrics — expanded as additional data sources are integrated.
            </p>
          </div>
          <span className="text-muted text-xl">{advancedOpen ? "−" : "+"}</span>
        </button>
        {advancedOpen && (
          <div className="px-5 sm:px-6 pb-6 border-t border-card-border">
            <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border border-dashed border-card-border p-4">
                <h3 className="font-semibold">Committee assignments</h3>
                <p className="text-muted mt-1">
                  Coming soon — average scores by Judiciary, Energy & Commerce, and other
                  relevant committees.
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-card-border p-4">
                <h3 className="font-semibold">District competitiveness</h3>
                <p className="text-muted mt-1">
                  Correlation with safe vs. swing districts requires external election data.
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-card-border p-4">
                <h3 className="font-semibold">Ideology scores</h3>
                <p className="text-muted mt-1">
                  DW-NOMINATE or similar scores can be layered in a future release.
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-card-border p-4">
                <h3 className="font-semibold">Urban / rural / suburban</h3>
                <p className="text-muted mt-1">
                  District density classification pending Census crosswalk integration.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Bipartisan support by bill</h3>
              <ChartBars
                items={bills
                  .filter((b) => b.bipartisanSupport != null)
                  .map((b) => ({
                    label: b.billNumber,
                    value: b.bipartisanSupport ?? 0,
                    displayValue: `${b.bipartisanSupport}%`,
                    colorClass: "bg-purple-500",
                  }))}
              />
              <p className="text-xs text-muted mt-2">
                Bipartisan support = 100% minus the gap between Democrat and Republican
                pro-protection vote rates on each bill.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}