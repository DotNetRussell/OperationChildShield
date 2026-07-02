import { describe, expect, it } from "vitest";
import { buildSharePayload, buildShareText } from "./share";

describe("buildShareText", () => {
  it("includes name, party, policy labels, stats, and report link", () => {
    const text = buildShareText({
      bioguideId: "T000001",
      name: "Smith, John",
      party: "Democratic",
      votesTracked: 5,
      keyVotes: [
        {
          bill_number: "HR 6484",
          bill_title: "Kids Online Safety Act",
          vote_cast: "Aye",
          policy_consistent: true,
        },
        {
          bill_number: "HR 134",
          bill_title: "Protecting our Communities from Sexual Predators Act",
          vote_cast: "Nay",
          policy_consistent: false,
        },
      ],
    });

    expect(text).toContain("John Smith (Democrat)");
    expect(text).toContain("Child Safety Voting Record");
    expect(text).toContain("Consistent with OCS policy");
    expect(text).toContain("Not consistent with OCS policy");
    expect(text).toContain("5 bills tracked");
    expect(text).toContain("/member/T000001");
  });

  it("handles missing vote data without score language", () => {
    const text = buildShareText({
      bioguideId: "T000002",
      name: "Doe, Jane",
      party: "Republican",
    });

    expect(text).toContain("Child Safety Voting Record");
    expect(text).not.toContain("Grade");
    expect(text).not.toContain("Score");
    expect(text).not.toContain("%");
  });
});

describe("buildSharePayload", () => {
  it("returns title, text, and url", () => {
    const payload = buildSharePayload({
      bioguideId: "T000003",
      name: "Lee, Amy",
      party: "Independent",
      keyVotes: [
        {
          bill_number: "HR 1",
          bill_title: "Example Bill",
          vote_cast: "Aye",
          policy_consistent: true,
        },
      ],
    });

    expect(payload.title).toContain("Amy Lee");
    expect(payload.url).toContain("/member/T000003");
    expect(payload.text).toContain("Consistent with OCS policy");
  });
});