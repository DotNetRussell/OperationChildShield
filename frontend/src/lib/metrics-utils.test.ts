import { describe, expect, it } from "vitest";

import {
  computeKpis,
  filterMembers,
  formatPercent,
  scoreBg,
  scoreColor,
} from "./metrics-utils";
import type { MetricsMember } from "./metrics-types";

function member(overrides: Partial<MetricsMember> = {}): MetricsMember {
  return {
    bioguideId: "A000001",
    name: "Jane Doe",
    chamber: "House",
    state: "California",
    stateCode: "CA",
    region: "West",
    party: "Democratic",
    partyNormalized: "Democrat",
    district: 12,
    imageUrl: null,
    letterGrade: "A",
    gradeBucket: "A",
    scorePercent: 95,
    votesScored: 5,
    votesParticipated: 5,
    notVotingCount: 0,
    participationRate: 100,
    termCount: 2,
    seniorityBucket: "2–4 terms",
    passingGrade: true,
    congressUrl: "https://www.congress.gov/member/jane-doe/A000001",
    ...overrides,
  };
}

describe("filterMembers", () => {
  const members = [
    member(),
    member({
      bioguideId: "B000002",
      chamber: "Senate",
      partyNormalized: "Republican",
      state: "Texas",
      region: "South",
      letterGrade: "N/A",
      gradeBucket: "N/A",
      scorePercent: 0,
      passingGrade: false,
    }),
  ];

  it("filters by chamber", () => {
    expect(filterMembers(members, { chamber: "House" })).toHaveLength(1);
  });

  it("filters by party and state", () => {
    expect(
      filterMembers(members, { party: "Republican", state: "Texas" })
    ).toHaveLength(1);
  });
});

describe("computeKpis", () => {
  it("computes house-only averages", () => {
    const members = [
      member({ scorePercent: 80, passingGrade: true }),
      member({
        bioguideId: "C000003",
        scorePercent: 60,
        letterGrade: "D-",
        gradeBucket: "D",
        passingGrade: false,
      }),
      member({
        bioguideId: "D000004",
        chamber: "Senate",
        letterGrade: "N/A",
        gradeBucket: "N/A",
        passingGrade: false,
      }),
    ];
    const kpis = computeKpis(members, 30, 7);
    expect(kpis.totalMembersTracked).toBe(3);
    expect(kpis.houseMembersScored).toBe(2);
    expect(kpis.avgProtectionScore).toBe(70);
    expect(kpis.passingGradePercent).toBe(50);
    expect(kpis.totalBillsTracked).toBe(30);
    expect(kpis.totalBillsScored).toBe(7);
  });
});

describe("scoreColor and scoreBg", () => {
  it("maps score ranges to classes", () => {
    expect(scoreColor(85)).toContain("green");
    expect(scoreColor(75)).toContain("amber");
    expect(scoreColor(65)).toContain("orange");
    expect(scoreColor(50)).toContain("red");
    expect(scoreColor(null)).toContain("muted");
    expect(scoreBg(85)).toContain("green");
    expect(scoreBg(null)).toContain("slate");
  });
});

describe("formatPercent", () => {
  it("formats numbers and handles null", () => {
    expect(formatPercent(72.5)).toBe("72.5%");
    expect(formatPercent(null)).toBe("N/A");
  });
});
