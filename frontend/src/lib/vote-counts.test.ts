import { describe, expect, it } from "vitest";

import {
  aggregateRollCallVotes,
  countMemberYesNoVotes,
  isNoVote,
  isYesVote,
} from "./vote-counts";
import type { BillMetricsRow } from "./metrics-types";

describe("vote-counts", () => {
  it("detects yes and no votes", () => {
    expect(isYesVote("Aye")).toBe(true);
    expect(isNoVote("Nay")).toBe(true);
    expect(isYesVote("Not Voting")).toBe(false);
  });

  it("counts member yes/no votes only", () => {
    const counts = countMemberYesNoVotes([
      {
        bill_id: "1",
        bill_title: "A",
        bill_number: "HR 1",
        category: "Safety",
        vote_cast: "Aye",
        vote_date: null,
        vote_question: null,
        vote_result: null,
        congress_url: "https://example.com",
        roll_call_url: null,
        score_impact: "",
        policy_consistent: true,
      },
      {
        bill_id: "2",
        bill_title: "B",
        bill_number: "HR 2",
        category: "Safety",
        vote_cast: "Nay",
        vote_date: null,
        vote_question: null,
        vote_result: null,
        congress_url: "https://example.com",
        roll_call_url: null,
        score_impact: "",
        policy_consistent: false,
      },
      {
        bill_id: "3",
        bill_title: "C",
        bill_number: "HR 3",
        category: "Safety",
        vote_cast: "Not Voting",
        vote_date: null,
        vote_question: null,
        vote_result: null,
        congress_url: "https://example.com",
        roll_call_url: null,
        score_impact: "",
        policy_consistent: false,
      },
    ]);

    expect(counts).toEqual({ yes: 1, no: 1 });
  });

  it("aggregates roll-call totals across bills", () => {
    const bills: BillMetricsRow[] = [
      {
        billId: "hr1",
        billNumber: "HR 1",
        billTitle: "Bill 1",
        congressUrl: "https://example.com/1",
        eligibleMembers: 10,
        voteCounts: { yes: 8, no: 1, notVoting: 1, present: 0, unknown: 0 },
        participationRate: 90,
        policyConsistentVotes: 7,
        policyNotConsistentVotes: 2,
      },
      {
        billId: "hr2",
        billNumber: "HR 2",
        billTitle: "Bill 2",
        congressUrl: "https://example.com/2",
        eligibleMembers: 0,
        voteCounts: { yes: 0, no: 0, notVoting: 0, present: 0, unknown: 0 },
        participationRate: null,
        policyConsistentVotes: 0,
        policyNotConsistentVotes: 0,
      },
    ];

    expect(aggregateRollCallVotes(bills)).toEqual({
      yes: 8,
      no: 1,
      notVoting: 1,
      present: 0,
      unknown: 0,
    });
  });
});