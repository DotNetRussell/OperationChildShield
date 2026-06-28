import { describe, expect, it } from "vitest";

import {
  formatDisplayName,
  formatMemberSubtitle,
  formatPartyLabel,
  gradeCircleClass,
  partyBadgeClass,
  voteSortOrder,
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
  letterGrade: "A",
  imageUrl: null,
  congressUrl: "https://www.congress.gov/member/jane-doe/A000001",
};

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
