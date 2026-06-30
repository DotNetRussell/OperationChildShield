import type { MemberSummary } from "./types";

const STATE_CODES: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI",
  Wyoming: "WY", "District of Columbia": "DC", "Puerto Rico": "PR",
};

export function formatMemberSubtitle(member: MemberSummary): string {
  const prefix = member.chamber === "Senate" ? "Sen." : "Rep.";
  const stateCode =
    member.stateCode ||
    STATE_CODES[member.state] ||
    member.state.slice(0, 2).toUpperCase();

  const location =
    member.chamber === "House" && member.district != null
      ? `${stateCode}-${member.district}`
      : stateCode;

  return `${prefix} ${location}`;
}

/** @deprecated Use formatMemberSubtitle — party shown separately on cards */
export function formatMemberTitle(member: MemberSummary): string {
  return `${formatMemberSubtitle(member)} • ${formatPartyLabel(member.party)}`;
}

export function formatPartyLabel(party: string): string {
  const p = party.trim();
  if (!p || p === "Unknown") return "Unknown";
  if (p.toLowerCase().includes("democrat")) return "Democrat";
  if (p.toLowerCase().includes("republican")) return "Republican";
  if (p.toLowerCase().includes("independent")) return "Independent";
  return p;
}

export function partyBadgeClass(
  party: string,
  variant: "header" | "light" = "light"
): string {
  const label = formatPartyLabel(party).toLowerCase();
  if (variant === "header") {
    if (label === "democrat") return "bg-white text-blue-800 border-white shadow-sm";
    if (label === "republican") return "bg-red-600 text-white border-red-700";
    if (label === "independent") return "bg-purple-100 text-purple-900 border-purple-200";
    return "bg-white/90 text-slate-700 border-white/80";
  }
  if (label === "democrat") return "bg-blue-100 text-blue-800 border-blue-300";
  if (label === "republican") return "bg-red-100 text-red-800 border-red-300";
  if (label === "independent") return "bg-purple-100 text-purple-800 border-purple-300";
  return "bg-surface-subtle text-text-subtle border-card-border";
}

export function formatDisplayName(invertedName: string): string {
  const parts = invertedName.split(",").map((p) => p.trim());
  if (parts.length >= 2) return `${parts[1]} ${parts[0]}`;
  return invertedName;
}

export function gradeCircleClass(grade: string): string {
  const letter = grade.charAt(0).toUpperCase();
  if (letter === "A") return "grade-circle-a";
  if (letter === "B") return "grade-circle-b";
  if (letter === "C") return "grade-circle-c";
  if (letter === "D") return "grade-circle-d";
  if (letter === "F") return "grade-circle-f";
  return "grade-circle-na";
}

export function voteToLabel(vote: string): { label: string; className: string } {
  const v = vote.toLowerCase();
  if (v === "aye" || v === "yea" || v === "yes") return { label: "Yes", className: "vote-yes" };
  if (v === "nay" || v === "no") return { label: "No", className: "vote-no" };
  if (v === "not voting") return { label: "Not Voting", className: "vote-no" };
  if (v === "present") return { label: "Present", className: "vote-no" };
  if (v === "unknown") return { label: "No vote held yet", className: "vote-neutral" };
  return { label: vote, className: "vote-neutral" };
}

/** Report card order: no/absent votes → yes votes → bills awaiting a floor vote. */
export function voteSortOrder(vote: string): number {
  const v = vote.toLowerCase();
  if (v === "unknown") return 2;
  if (v === "aye" || v === "yea" || v === "yes") return 1;
  return 0;
}