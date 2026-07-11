import { describe, expect, it } from "vitest";

import {
  formatDisplayName,
  formatMemberSubtitle,
  formatPartyLabel,
  formatUtcTimestamp,
  gradeCircleClass,
  partyBadgeClass,
  voteSortOrder,
  resolvePolicyConsistent,
  summarizeMemberVotes,
  voteToLabel,
} from "./format";
import type { MemberSummary } from "./types";

const houseMember: MemberSummary = {
  bioguideId: "A000001",
  name: "Jane Doe",
  chamber: "House",
  state: "California",
  stateCode: "CA",
  party: "Democratic",
  district: 12,
  imageUrl: null,
  congressUrl: "https://www.congress.gov/member/jane-doe/A000001",
};

describe("formatUtcTimestamp", () => {
  it("formats ISO timestamps in UTC with time zone label", () => {
    expect(formatUtcTimestamp("2026-07-08T05:53:43.000Z")).toBe(
      "7/8/2026, 5:53:43 AM UTC"
    );
  });

  it("returns the original string for invalid dates", () => {
    expect(formatUtcTimestamp("not-a-date")).toBe("not-a-date");
  });
});

const senateMember: MemberSummary = {
  ...houseMember,
  chamber: "Senate",
  district: null,
};

describe("formatMemberSubtitle", () => {
  it("formats House members with district", () => {
    expect(formatMemberSubtitle(houseMember)).toBe("Rep. CA-12");
  });

  it("formats Senate members with state only", () => {
    expect(formatMemberSubtitle(senateMember)).toBe("Sen. CA");
  });
});

describe("formatPartyLabel", () => {
  it("normalizes party names", () => {
    expect(formatPartyLabel("Democratic")).toBe("Democrat");
    expect(formatPartyLabel("Republican Party")).toBe("Republican");
    expect(formatPartyLabel("Independent")).toBe("Independent");
    expect(formatPartyLabel("")).toBe("Unknown");
  });
});

describe("partyBadgeClass", () => {
  it("returns democrat styling", () => {
    expect(partyBadgeClass("Democrat")).toContain("blue");
  });
});

describe("formatDisplayName", () => {
  it("converts inverted names", () => {
    expect(formatDisplayName("Doe, Jane")).toBe("Jane Doe");
    expect(formatDisplayName("Jane Doe")).toBe("Jane Doe");
  });
});

describe("gradeCircleClass", () => {
  it("maps letter grades to CSS classes", () => {
    expect(gradeCircleClass("A+")).toBe("grade-circle-a");
    expect(gradeCircleClass("F")).toBe("grade-circle-f");
    expect(gradeCircleClass("N/A")).toBe("grade-circle-na");
  });
});

describe("voteToLabel", () => {
  it("maps vote strings to labels", () => {
    expect(voteToLabel("Aye").label).toBe("Yes");
    expect(voteToLabel("Nay").label).toBe("No");
    expect(voteToLabel("Present").label).toBe("Present");
    expect(voteToLabel("unknown").label).toBe("No vote held yet");
  });
});

describe("voteSortOrder", () => {
  it("orders no/absent votes before yes votes", () => {
    expect(voteSortOrder("Nay")).toBeLessThan(voteSortOrder("Aye"));
    expect(voteSortOrder("Aye")).toBeLessThan(voteSortOrder("unknown"));
  });
});

describe("summarizeMemberVotes", () => {
  it("counts recorded, consistent, and not consistent votes", () => {
    const summary = summarizeMemberVotes([
      {
        bill_id: "hr1",
        bill_title: "Bill 1",
        bill_number: "HR 1",
        category: "Safety",
        vote_cast: "Aye",
        vote_date: null,
        vote_question: null,
        vote_result: null,
        congress_url: "https://example.com",
        roll_call_url: null,
        score_impact: "Consistent with OCS board-adopted policy position",
        policy_consistent: true,
      },
      {
        bill_id: "hr2",
        bill_title: "Bill 2",
        bill_number: "HR 2",
        category: "Safety",
        vote_cast: "Nay",
        vote_date: null,
        vote_question: null,
        vote_result: null,
        congress_url: "https://example.com",
        roll_call_url: null,
        score_impact: "Not consistent with OCS board-adopted policy position",
        policy_consistent: false,
      },
      {
        bill_id: "hr3",
        bill_title: "Bill 3",
        bill_number: "HR 3",
        category: "Safety",
        vote_cast: "Not Voting",
        vote_date: null,
        vote_question: null,
        vote_result: null,
        congress_url: "https://example.com",
        roll_call_url: null,
        score_impact: "Not consistent with OCS board-adopted policy position",
        policy_consistent: false,
      },
      {
        bill_id: "hr4",
        bill_title: "Bill 4",
        bill_number: "HR 4",
        category: "Safety",
        vote_cast: "Unknown",
        vote_date: null,
        vote_question: null,
        vote_result: null,
        congress_url: "https://example.com",
        roll_call_url: null,
        score_impact: "No roll call yet",
        policy_consistent: null,
      },
    ]);

    expect(summary).toEqual({
      recorded: 3,
      consistent: 1,
      notConsistent: 2,
      notVoting: 1,
    });
  });
});

describe("resolvePolicyConsistent", () => {
  it("uses explicit policy flag when present", () => {
    expect(resolvePolicyConsistent(true)).toBe(true);
    expect(resolvePolicyConsistent(false)).toBe(false);
  });

  it("falls back to score impact wording", () => {
    expect(
      resolvePolicyConsistent(null, "Consistent with OCS board-adopted policy position")
    ).toBe(true);
    expect(
      resolvePolicyConsistent(
        null,
        "Not consistent with OCS board-adopted policy position"
      )
    ).toBe(false);
  });
});
