export interface GradeBucketStat {
  count: number;
  percent: number;
}

export interface MetricsPerformer {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  stateCode?: string;
  chamber: string;
  scorePercent: number;
  letterGrade: string;
  imageUrl?: string | null;
  congressUrl: string;
  notVotingRate?: number;
}

export interface MetricsMember {
  bioguideId: string;
  name: string;
  chamber: string;
  state: string;
  stateCode: string;
  region: string;
  party: string;
  partyNormalized: string;
  district: string | number | null;
  imageUrl: string | null;
  letterGrade: string;
  gradeBucket: string;
  scorePercent: number;
  votesScored: number;
  votesParticipated: number;
  notVotingCount: number;
  participationRate: number;
  termCount: number;
  seniorityBucket: string;
  passingGrade: boolean;
  congressUrl: string;
}

export interface MetricsKpis {
  avgProtectionScore: number | null;
  totalMembersTracked: number;
  houseMembersScored: number;
  totalBillsTracked: number;
  totalBillsScored: number;
  avgParticipationRate: number | null;
  passingGradePercent: number;
  totalNotVotingInstances: number;
}

export interface BillInsight {
  billId: string;
  billNumber: string;
  billTitle: string;
  congressUrl: string;
  eligibleMembers: number;
  participationRate: number;
  notVotingRate: number;
  avgScoreImpact: number;
  protectionVoteRate: number;
  democratProtectionRate: number | null;
  republicanProtectionRate: number | null;
  bipartisanSupport: number | null;
}

export interface StateMetric {
  state: string;
  stateCode: string;
  region: string;
  memberCount: number;
  scoredCount: number;
  avgScore: number | null;
  participationRate: number | null;
  passingPercent: number;
  notVotingInstances: number;
  rank: number;
}

export interface MetricsDashboardData {
  congress: number;
  lastUpdated: string;
  dataSource: string;
  scoringNote: string;
  kpis: MetricsKpis;
  scoreDistribution: {
    gradeBuckets: Record<string, GradeBucketStat>;
    histogram: { label: string; count: number }[];
    mean: number | null;
    median: number | null;
  };
  byParty: {
    party: string;
    memberCount: number;
    avgScore: number | null;
    participationRate: number | null;
    notVotingInstances: number;
    gradeDistribution: Record<string, GradeBucketStat>;
    topPerformers: MetricsPerformer[];
    bottomPerformers: MetricsPerformer[];
  }[];
  byChamber: {
    chamber: string;
    memberCount: number;
    avgScore: number | null;
    participationRate: number | null;
    notVotingInstances: number;
    gradeDistribution: Record<string, GradeBucketStat>;
    scoredCount: number;
  }[];
  byState: StateMetric[];
  byRegion: {
    region: string;
    memberCount: number;
    avgScore: number | null;
    participationRate: number | null;
    gradeDistribution: Record<string, GradeBucketStat>;
  }[];
  bySeniority: {
    bucket: string;
    memberCount: number;
    avgScore: number | null;
    participationRate: number | null;
  }[];
  nonVoting: {
    overallNotVotingRate: number;
    totalNotVotingInstances: number;
    avgMissedVotesPerMember: number;
    topMembersByMissedVotes: MetricsPerformer[];
    billsHighestNotVoting: BillInsight[];
    scoreVsMissedVotes: {
      bioguideId: string;
      name: string;
      scorePercent: number;
      missedVotes: number;
    }[];
  };
  performers: {
    top10: MetricsPerformer[];
    bottom10: MetricsPerformer[];
    nearPerfectScores: MetricsPerformer[];
    perfectParticipation: MetricsPerformer[];
  };
  billInsights: BillInsight[];
  stateRankings: {
    top5: StateMetric[];
    bottom5: StateMetric[];
  };
  members: MetricsMember[];
  filterOptions: {
    chambers: string[];
    parties: string[];
    states: string[];
    regions: string[];
    seniorityBuckets: string[];
    gradeBuckets: string[];
  };
}

export interface MetricsFilters {
  chamber: string;
  party: string;
  state: string;
  region: string;
  seniority: string;
  grade: string;
}

export const DEFAULT_METRICS_FILTERS: MetricsFilters = {
  chamber: "",
  party: "",
  state: "",
  region: "",
  seniority: "",
  grade: "",
};