import { describe, expect, it } from "vitest";

import { buildShareText, buildSharePayload, getReportPageUrl } from "./share";

describe("getReportPageUrl", () => {
  it("builds member report URLs", () => {
    expect(getReportPageUrl("S000033", "https://operationchildshield.org")).toBe(
      "https://operationchildshield.org/member/S000033"
    );
  });
});

describe("buildShareText", () => {
  it("includes name, party, grade, key votes, stats, and report link", () => {
    const text = buildShareText(
      {
        bioguideId: "M001157",
        name: "McCaul, Michael T.",
        party: "Republican",
        letterGrade: "B",
        scorePercent: 78,
        votesScored: 2,
        votesTracked: 5,
        keyVotes: [
          {
            bill_number: "H.R. 734",
            bill_title: "Protection of Women and Girls in Sports Act",
            vote_cast: "Aye",
          },
          {
            bill_number: "H.R. 5",
            bill_title: "Parents Bill of Rights Act",
            vote_cast: "Nay",
          },
        ],
        chamber: "House",
      },
      "https://operationchildshield.org"
    );

    expect(text).toContain("Michael T. McCaul (Republican)");
    expect(text).toContain("Child Protection Grade: B");
    expect(text).toContain("Protection Score: 78%");
    expect(text).toContain("• H.R. 734 — Yes");
    expect(text).toContain("• H.R. 5 — No");
    expect(text).toContain("2 votes scored • 5 bills tracked");
    expect(text).toContain("https://operationchildshield.org/member/M001157");
  });

  it("handles missing report data gracefully", () => {
    const text = buildShareText(
      {
        bioguideId: "A000374",
        name: "Abraham, Ralph Lee",
        party: "Republican",
        letterGrade: "—",
        chamber: "House",
      },
      "https://operationchildshield.org"
    );

    expect(text).toContain("Ralph Lee Abraham (Republican)");
    expect(text).toContain("Child Protection Grade: —");
    expect(text).not.toContain("Protection Score:");
    expect(text).toContain("No floor votes on tracked child protection bills yet.");
  });
});

describe("buildSharePayload", () => {
  it("separates report URL from full share message", () => {
    const payload = buildSharePayload(
      {
        bioguideId: "S000033",
        name: "Sanders, Bernard",
        party: "Independent",
        letterGrade: "F",
        scorePercent: 12,
        votesScored: 1,
        votesTracked: 4,
        keyVotes: [],
        chamber: "Senate",
      },
      "https://operationchildshield.org"
    );

    expect(payload.url).toBe("https://operationchildshield.org/member/S000033");
    expect(payload.text).toContain(payload.url);
    expect(payload.text).not.toBe(payload.url);
  });
});