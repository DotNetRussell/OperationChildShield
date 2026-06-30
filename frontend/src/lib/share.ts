import { formatDisplayName, formatPartyLabel, voteToLabel } from "./format";
import type { MemberVote } from "./types";

export interface ShareReportInput {
  bioguideId: string;
  name: string;
  party: string;
  letterGrade: string;
  scorePercent?: number | null;
  votesScored?: number | null;
  votesTracked?: number | null;
  keyVotes?: Pick<MemberVote, "bill_number" | "bill_title" | "vote_cast">[];
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

function formatKeyVoteLine(
  vote: Pick<MemberVote, "bill_number" | "bill_title" | "vote_cast">
): string {
  const label = voteToLabel(vote.vote_cast).label;
  const billRef = vote.bill_number?.trim() || vote.bill_title.trim();
  return `• ${billRef} — ${label}`;
}

function keyVotesMessage(input: ShareReportInput): string {
  const votes = (input.keyVotes ?? []).filter((v) => v.vote_cast !== "Unknown");
  if (votes.length > 0) {
    return votes.map(formatKeyVoteLine).join("\n");
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
  const grade = input.letterGrade?.trim() || "—";
  const url = getReportPageUrl(input.bioguideId, origin);

  const scoreLine =
    input.scorePercent != null
      ? `Protection Score: ${input.scorePercent}%`
      : null;

  const statsParts: string[] = [];
  if (input.votesScored != null) {
    statsParts.push(`${input.votesScored} vote${input.votesScored === 1 ? "" : "s"} scored`);
  }
  if (input.votesTracked != null) {
    statsParts.push(`${input.votesTracked} bill${input.votesTracked === 1 ? "" : "s"} tracked`);
  }
  const statsLine = statsParts.length ? statsParts.join(" • ") : null;

  const lines = [
    `${displayName} (${party})`,
    `Child Protection Grade: ${grade}`,
    scoreLine,
    "",
    "Key votes:",
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
  const title = `${formatDisplayName(input.name)} — Operation Child Shield`;
  return { title, text, url };
}