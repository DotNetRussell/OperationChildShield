export interface MetricsVoteCounts {
  yes: number;
  no: number;
  notVoting: number;
  present: number;
  unknown: number;
}

export interface BillMetricsRow {
  billId: string;
  billNumber: string;
  billTitle: string;
  congressUrl: string;
  eligibleMembers: number;
  voteCounts: MetricsVoteCounts;
  participationRate: number | null;
  policyConsistentVotes: number;
  policyNotConsistentVotes: number;
}

export interface ChamberMetricsSummary {
  chamber: string;
  memberCount: number;
  membersWithRecordedVotes: number;
  totalRecordedVotes: number;
  totalNotVotingInstances: number;
}

export interface MetricsKpis {
  totalMembersTracked: number;
  houseMembersWithRecordedVotes: number;
  totalBillsTracked: number;
  billsWithRollCalls: number;
  totalRecordedFloorVotes: number;
  totalNotVotingInstances: number;
}

/** House roll-call aggregates for one state. */
export interface StateMetric {
  state: string;
  stateCode: string;
  membersTracked: number;
  houseMembersTracked: number;
  houseMembersWithRecordedVotes: number;
  recordedVotes: number;
  policyConsistentVotes: number;
  policyNotConsistentVotes: number;
  policyConsistencyRate: number | null;
  votesParticipated: number;
  notVotingCount: number;
  participationRate: number | null;
}

export interface MetricsOverview {
  congress: number;
  lastUpdated: string;
  dataSource: string;
  methodologyNote: string;
  kpis: MetricsKpis;
  chamberSummary: ChamberMetricsSummary[];
  byState: StateMetric[];
  bills: BillMetricsRow[];
}
