import { describe, expect, it } from "vitest";
import type { StateMetric } from "./metrics-types";
import {
  formatConsistencyRate,
  heatColorForRate,
  indexStateMetrics,
  statesWithRecordedVotes,
} from "./state-metrics";

const sample: StateMetric[] = [
  {
    state: "Texas",
    stateCode: "TX",
    membersTracked: 40,
    houseMembersTracked: 38,
    houseMembersWithRecordedVotes: 30,
    recordedVotes: 10,
    policyConsistentVotes: 8,
    policyNotConsistentVotes: 2,
    policyConsistencyRate: 80,
    votesParticipated: 10,
    notVotingCount: 0,
    participationRate: 100,
  },
  {
    state: "Maine",
    stateCode: "ME",
    membersTracked: 4,
    houseMembersTracked: 2,
    houseMembersWithRecordedVotes: 0,
    recordedVotes: 0,
    policyConsistentVotes: 0,
    policyNotConsistentVotes: 0,
    policyConsistencyRate: null,
    votesParticipated: 0,
    notVotingCount: 0,
    participationRate: null,
  },
  {
    state: "Ohio",
    stateCode: "OH",
    membersTracked: 18,
    houseMembersTracked: 15,
    houseMembersWithRecordedVotes: 12,
    recordedVotes: 20,
    policyConsistentVotes: 5,
    policyNotConsistentVotes: 15,
    policyConsistencyRate: 25,
    votesParticipated: 18,
    notVotingCount: 2,
    participationRate: 90,
  },
];

describe("heatColorForRate", () => {
  it("returns empty color for missing rate", () => {
    expect(heatColorForRate(null)).toContain("#94a3b8");
  });

  it("uses darker blue for high consistency", () => {
    expect(heatColorForRate(90)).toBe("#1e3a5f");
  });
});

describe("formatConsistencyRate", () => {
  it("formats rate and missing data", () => {
    expect(formatConsistencyRate(72.5)).toBe("72.5% policy-consistent");
    expect(formatConsistencyRate(null)).toBe("No recorded votes");
  });
});

describe("indexStateMetrics", () => {
  it("indexes by uppercase code", () => {
    const map = indexStateMetrics(sample);
    expect(map.get("TX")?.state).toBe("Texas");
  });
});

describe("statesWithRecordedVotes", () => {
  it("excludes empty states and sorts by rate", () => {
    const ranked = statesWithRecordedVotes(sample);
    expect(ranked.map((r) => r.stateCode)).toEqual(["TX", "OH"]);
  });
});
