import { formatPartyLabel } from "./format";

/** Prefer directory party; ignore report-card "Unknown" overrides. */
export function resolveParty(
  memberParty?: string,
  reportParty?: string
): string {
  const fromMember = (memberParty || "").trim();
  const fromReport = (reportParty || "").trim();

  if (fromMember && fromMember !== "Unknown") {
    return fromMember;
  }
  if (fromReport && fromReport !== "Unknown") {
    return fromReport;
  }
  return fromMember || fromReport;
}

export function hasKnownParty(party: string): boolean {
  const label = formatPartyLabel(party);
  return Boolean(label && label !== "Unknown");
}