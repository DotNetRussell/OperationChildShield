import type {
  BillInsight,
  GradeBucketStat,
  MetricsDashboardData,
  MetricsFilters,
  MetricsKpis,
  MetricsMember,
  MetricsPerformer,
  StateMetric,
} from "./metrics-types";

const GRADE_BUCKETS = ["A", "B", "C", "D", "F", "N/A"] as const;

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function gradeDistribution(members: MetricsMember[]): Record<string, GradeBucketStat> {
  const counts = new Map<string, number>();
  for (const m of members) {
    counts.set(m.gradeBucket, (counts.get(m.gradeBucket) || 0) + 1);
  }
  const total = members.length || 1;
  const result: Record<string, GradeBucketStat> = {};
  for (const bucket of GRADE_BUCKETS) {
    const count = counts.get(bucket) || 0;
    result[bucket] = {
      count,
      percent: Math.round((count / total) * 1000) / 10,
    };
  }
  return result;
}

function performerFromMember(m: MetricsMember): MetricsPerformer {
  return {
    bioguideId: m.bioguideId,
    name: m.name,
    party: m.partyNormalized,
    state: m.state,
    stateCode: m.stateCode,
    chamber: m.chamber,
    scorePercent: m.scorePercent,
    letterGrade: m.letterGrade,
    imageUrl: m.imageUrl,
    congressUrl: m.congressUrl,
  };
}

export function filterMembers(
  members: MetricsMember[],
  filters: MetricsFilters
): MetricsMember[] {
  return members.filter((m) => {
    if (filters.chamber && m.chamber !== filters.chamber) return false;
    if (filters.party && m.partyNormalized !== filters.party) return false;
    if (filters.state && m.state !== filters.state) return false;
    if (filters.region && m.region !== filters.region) return false;
    if (filters.seniority && m.seniorityBucket !== filters.seniority) return false;
    if (filters.grade && m.gradeBucket !== filters.grade) return false;
    return true;
  });
}

export function computeKpis(
  members: MetricsMember[],
  billsTracked: number,
  billsScored: number
): MetricsKpis {
  const houseScored = members.filter(
    (m) => m.chamber === "House" && m.letterGrade !== "N/A"
  );
  const scores = houseScored.map((m) => m.scorePercent);
  const passing = houseScored.filter((m) => m.passingGrade);
  const participation = houseScored
    .filter((m) => m.votesScored > 0)
    .map((m) => m.participationRate);

  return {
    avgProtectionScore: mean(scores),
    totalMembersTracked: members.length,
    houseMembersScored: houseScored.length,
    totalBillsTracked: billsTracked,
    totalBillsScored: billsScored,
    avgParticipationRate: mean(participation),
    passingGradePercent: houseScored.length
      ? Math.round((passing.length / houseScored.length) * 1000) / 10
      : 0,
    totalNotVotingInstances: members.reduce((sum, m) => sum + m.notVotingCount, 0),
  };
}

export function computeFilteredView(
  data: MetricsDashboardData,
  filters: MetricsFilters
) {
  const members = filterMembers(data.members, filters);
  const houseScored = members.filter(
    (m) => m.chamber === "House" && m.letterGrade !== "N/A"
  );
  const scores = houseScored.map((m) => m.scorePercent);

  const histogram = data.scoreDistribution.histogram.map((bin) => {
    const [low] = bin.label.split("-").map((s) => parseInt(s, 10));
    const count = scores.filter((s) => {
      if (bin.label.includes("100")) return s >= low;
      const high = low + 10;
      return s >= low && s < high;
    }).length;
    return { ...bin, count };
  });

  const sorted = [...houseScored].sort((a, b) => b.scorePercent - a.scorePercent);
  const perfectParticipation = houseScored.filter(
    (m) => m.votesScored > 0 && m.votesParticipated === m.votesScored
  );

  const byPartyMap = new Map<string, MetricsMember[]>();
  for (const m of members.filter((x) => x.chamber === "House")) {
    const list = byPartyMap.get(m.partyNormalized) || [];
    list.push(m);
    byPartyMap.set(m.partyNormalized, list);
  }

  const byParty = [...byPartyMap.entries()].map(([party, group]) => {
    const scored = [...group]
      .filter((m) => m.letterGrade !== "N/A")
      .sort((a, b) => b.scorePercent - a.scorePercent);
    return {
      party,
      memberCount: group.length,
      avgScore: mean(scored.map((m) => m.scorePercent)),
      participationRate: mean(
        group.filter((m) => m.votesScored > 0).map((m) => m.participationRate)
      ),
      notVotingInstances: group.reduce((s, m) => s + m.notVotingCount, 0),
      gradeDistribution: gradeDistribution(group),
      topPerformers: scored.slice(0, 5).map(performerFromMember),
      bottomPerformers: scored.slice(-5).reverse().map(performerFromMember),
    };
  });

  const byChamber = (["House", "Senate"] as const)
    .map((chamber) => {
      const group = members.filter((m) => m.chamber === chamber);
      if (!group.length) return null;
      return {
        chamber,
        memberCount: group.length,
        avgScore: mean(
          group.filter((m) => m.letterGrade !== "N/A").map((m) => m.scorePercent)
        ),
        participationRate: mean(
          group.filter((m) => m.votesScored > 0).map((m) => m.participationRate)
        ),
        notVotingInstances: group.reduce((s, m) => s + m.notVotingCount, 0),
        gradeDistribution: gradeDistribution(group),
        scoredCount: group.filter((m) => m.letterGrade !== "N/A").length,
      };
    })
    .filter(Boolean) as MetricsDashboardData["byChamber"];

  const byStateMap = new Map<string, MetricsMember[]>();
  for (const m of members.filter((x) => x.chamber === "House")) {
    const list = byStateMap.get(m.state) || [];
    list.push(m);
    byStateMap.set(m.state, list);
  }

  const byState: StateMetric[] = [...byStateMap.entries()]
    .map(([state, group]) => {
      const scored = group.filter((m) => m.letterGrade !== "N/A");
      const passing = scored.filter((m) => m.passingGrade);
      return {
        state,
        stateCode: group[0]?.stateCode || "",
        region: group[0]?.region || "Other",
        memberCount: group.length,
        scoredCount: scored.length,
        avgScore: mean(scored.map((m) => m.scorePercent)),
        participationRate: mean(
          group.filter((m) => m.votesScored > 0).map((m) => m.participationRate)
        ),
        passingPercent: scored.length
          ? Math.round((passing.length / scored.length) * 1000) / 10
          : 0,
        notVotingInstances: group.reduce((s, m) => s + m.notVotingCount, 0),
        rank: 0,
      };
    })
    .sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1));

  byState.forEach((row, i) => {
    row.rank = i + 1;
  });

  const byRegionMap = new Map<string, MetricsMember[]>();
  for (const m of members.filter((x) => x.chamber === "House")) {
    const list = byRegionMap.get(m.region) || [];
    list.push(m);
    byRegionMap.set(m.region, list);
  }

  const byRegion = [...byRegionMap.entries()].map(([region, group]) => ({
    region,
    memberCount: group.length,
    avgScore: mean(group.filter((m) => m.letterGrade !== "N/A").map((m) => m.scorePercent)),
    participationRate: mean(
      group.filter((m) => m.votesScored > 0).map((m) => m.participationRate)
    ),
    gradeDistribution: gradeDistribution(group),
  }));

  const seniorityBuckets = [
    "Freshman (1 term)",
    "2-4 terms",
    "5-8 terms",
    "9+ terms (Senior)",
  ];
  const bySeniority = seniorityBuckets
    .map((bucket) => {
      const group = members.filter(
        (m) => m.chamber === "House" && m.seniorityBucket === bucket
      );
      if (!group.length) return null;
      return {
        bucket,
        memberCount: group.length,
        avgScore: mean(group.filter((m) => m.letterGrade !== "N/A").map((m) => m.scorePercent)),
        participationRate: mean(
          group.filter((m) => m.votesScored > 0).map((m) => m.participationRate)
        ),
      };
    })
    .filter(Boolean) as MetricsDashboardData["bySeniority"];

  const houseWithVotes = houseScored.filter((m) => m.votesScored > 0);
  const totalScoredVotes = houseWithVotes.reduce((s, m) => s + m.votesScored, 0);
  const totalNv = houseWithVotes.reduce((s, m) => s + m.notVotingCount, 0);

  const topMembersByMissedVotes = houseWithVotes
    .map((m) => ({
      ...performerFromMember(m),
      notVotingRate: Math.round((m.notVotingCount / m.votesScored) * 1000) / 10,
    }))
    .sort((a, b) => (b.notVotingRate ?? 0) - (a.notVotingRate ?? 0))
    .slice(0, 10);

  return {
    members,
    kpis: computeKpis(members, data.kpis.totalBillsTracked, data.kpis.totalBillsScored),
    scoreDistribution: {
      gradeBuckets: gradeDistribution(houseScored),
      histogram,
      mean: mean(scores),
      median: scores.length
        ? (() => {
            const sortedScores = [...scores].sort((a, b) => a - b);
            const mid = Math.floor(sortedScores.length / 2);
            return sortedScores.length % 2
              ? sortedScores[mid]
              : Math.round(((sortedScores[mid - 1] + sortedScores[mid]) / 2) * 10) / 10;
          })()
        : null,
    },
    byParty,
    byChamber,
    byState,
    byRegion,
    bySeniority,
    performers: {
      top10: sorted.slice(0, 10).map(performerFromMember),
      bottom10: sorted.slice(-10).reverse().map(performerFromMember),
      nearPerfectScores: sorted.filter((m) => m.scorePercent >= 97).slice(0, 10).map(performerFromMember),
      perfectParticipation: perfectParticipation.slice(0, 10).map(performerFromMember),
    },
    nonVoting: {
      overallNotVotingRate: totalScoredVotes
        ? Math.round((totalNv / totalScoredVotes) * 1000) / 10
        : 0,
      totalNotVotingInstances: totalNv,
      avgMissedVotesPerMember: houseWithVotes.length
        ? Math.round((totalNv / houseWithVotes.length) * 100) / 100
        : 0,
      topMembersByMissedVotes,
      billsHighestNotVoting: data.billInsights,
      scoreVsMissedVotes: houseWithVotes.map((m) => ({
        bioguideId: m.bioguideId,
        name: m.name,
        scorePercent: m.scorePercent,
        missedVotes: m.notVotingCount,
      })),
    },
    stateRankings: {
      top5: byState.slice(0, 5),
      bottom5: [...byState].slice(-5).reverse(),
    },
    billInsights: data.billInsights,
  };
}

export function scoreColor(score: number | null | undefined): string {
  if (score == null) return "text-muted";
  if (score >= 80) return "text-green-600";
  if (score >= 70) return "text-amber-600";
  if (score >= 60) return "text-orange-600";
  return "text-red";
}

export function scoreBg(score: number | null | undefined): string {
  if (score == null) return "bg-slate-200";
  if (score >= 80) return "bg-green-500";
  if (score >= 70) return "bg-amber-500";
  if (score >= 60) return "bg-orange-500";
  return "bg-red-500";
}

export function formatPercent(value: number | null | undefined, suffix = "%"): string {
  if (value == null) return "N/A";
  return `${value}${suffix}`;
}

export function billInsightRows(bills: BillInsight[]) {
  return [...bills].sort((a, b) => b.participationRate - a.participationRate);
}