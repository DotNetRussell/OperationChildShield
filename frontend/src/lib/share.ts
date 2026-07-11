import { formatDisplayName, formatPartyLabel, voteToLabel } from "./format";
import type { MemberVote } from "./types";

export interface ShareReportInput {
  bioguideId: string;
  name: string;
  party: string;
  votesTracked?: number | null;
  keyVotes?: Pick<MemberVote, "bill_number" | "bill_title" | "vote_cast" | "policy_consistent">[];
  chamber?: string;
}

const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://operationchildshield.org";

export function getReportPageUrl(
  bioguideId: string,
  origin: string = DEFAULT_SITE_URL
): string {
  return `${origin.replace(/\/$/, "")}/member/${bioguideId}`;
}

function policyLabel(consistent: boolean | null | undefined): string {
  if (consistent === true) return "Consistent with OCS policy";
  if (consistent === false) return "Not consistent with OCS policy";
  return "No floor vote yet";
}

function formatKeyVoteLine(
  vote: Pick<MemberVote, "bill_number" | "bill_title" | "vote_cast" | "policy_consistent">
): string {
  const label = voteToLabel(vote.vote_cast).label;
  const billRef = vote.bill_number?.trim() || vote.bill_title.trim();
  return `• ${billRef}: ${label} (${policyLabel(vote.policy_consistent)})`;
}

function keyVotesMessage(input: ShareReportInput): string {
  const votes = (input.keyVotes ?? []).filter((v) => v.vote_cast !== "Unknown");
  if (votes.length > 0) {
    return votes.slice(0, 5).map(formatKeyVoteLine).join("\n");
  }
  if (input.chamber === "Senate") {
    return "• Senate floor votes are not yet available via Congress.gov API.";
  }
  return "• No floor votes on tracked child protection bills yet.";
}

export function buildShareText(
  input: ShareReportInput,
  origin: string = DEFAULT_SITE_URL
): string {
  const displayName = formatDisplayName(input.name);
  const party = formatPartyLabel(input.party);
  const url = getReportPageUrl(input.bioguideId, origin);

  const statsLine =
    input.votesTracked != null
      ? `${input.votesTracked} bill${input.votesTracked === 1 ? "" : "s"} tracked`
      : null;

  const lines = [
    `${displayName} (${party})`,
    "Child Safety Voting Record",
    "",
    "Recorded votes:",
    keyVotesMessage(input),
    statsLine,
    "",
    url,
  ];

  return lines.filter((line) => line !== null).join("\n");
}

export function buildSharePayload(
  input: ShareReportInput,
  origin: string = DEFAULT_SITE_URL
): { title: string; text: string; url: string } {
  const url = getReportPageUrl(input.bioguideId, origin);
  const text = buildShareText(input, origin);
  const title = `${formatDisplayName(input.name)} | Operation Child Shield`;
  return { title, text, url };
}