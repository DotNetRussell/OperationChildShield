/**
 * Short fact summaries of tracked child-safety legislation.
 * Each bullet states what the text does and links to Congress.gov.
 */

export interface PolicyBullet {
  /** Neutral one-line fact about the measure */
  text: string;
  /** Best available deep link into the bill (text, summary, or overview) */
  sourceUrl: string;
  /** Short label for the link (e.g. "Bill text", "Summary") */
  sourceLabel: string;
}

export interface PolicyDistillation {
  /** Anchor id on the policy page */
  id: string;
  title: string;
  category: string;
  /** Congress.gov overview for the primary bill */
  overviewUrl: string;
  /** One-line non-evaluative scope note */
  scope: string;
  bullets: PolicyBullet[];
  relatedBills: { label: string; url: string }[];
}

function billUrl(
  congress: number,
  chamber: "house" | "senate",
  number: number,
  suffix: "" | "/text" | "/summary" = ""
): string {
  const slug = chamber === "house" ? "house-bill" : "senate-bill";
  return `https://www.congress.gov/bill/${congress}th-congress/${slug}/${number}${suffix}`;
}

/**
 * Curated distillations grouped by policy family (not every companion bill).
 * Links prefer /text or /summary over the overview page alone.
 */
export const POLICY_DISTILLATIONS: PolicyDistillation[] = [
  {
    id: "kosa",
    title: "Kids Online Safety Act (KOSA)",
    category: "Online Safety",
    overviewUrl: billUrl(119, "house", 6484),
    scope:
      "Measures that set platform duties of care and design standards aimed at reducing online harms to minors.",
    bullets: [
      {
        text: "Establishes a duty of care for covered online platforms regarding minors' online safety.",
        sourceUrl: billUrl(119, "house", 6484, "/text"),
        sourceLabel: "H.R. 6484 text",
      },
      {
        text: "Addresses design features and default settings that can affect minors' exposure to harmful content.",
        sourceUrl: billUrl(119, "house", 6484, "/summary"),
        sourceLabel: "H.R. 6484 summary",
      },
      {
        text: "Companion and prior-Congress versions appear in the Senate and earlier sessions (same subject area).",
        sourceUrl: billUrl(119, "senate", 1748, "/text"),
        sourceLabel: "S. 1748 text",
      },
    ],
    relatedBills: [
      { label: "H.R. 6484 (119th)", url: billUrl(119, "house", 6484) },
      { label: "S. 1748 (119th)", url: billUrl(119, "senate", 1748) },
      { label: "H.R. 7891 (118th)", url: billUrl(118, "house", 7891) },
      { label: "S. 1409 (118th)", url: billUrl(118, "senate", 1409) },
      { label: "S. 2073 KOSA/COPPA package (118th)", url: billUrl(118, "senate", 2073) },
    ],
  },
  {
    id: "earn-it",
    title: "EARN IT Act",
    category: "Online Safety",
    overviewUrl: billUrl(118, "house", 2732),
    scope:
      "Bills focused on platform accountability related to online child sexual exploitation material.",
    bullets: [
      {
        text: "Creates a framework for a national commission and recommended best practices regarding online child sexual exploitation.",
        sourceUrl: billUrl(118, "house", 2732, "/summary"),
        sourceLabel: "H.R. 2732 summary",
      },
      {
        text: "Addresses civil liability and safe-harbor conditions tied to those best practices (as drafted in the bill text).",
        sourceUrl: billUrl(118, "house", 2732, "/text"),
        sourceLabel: "H.R. 2732 text",
      },
      {
        text: "Earlier EARN IT proposals appear in the 117th Congress House and Senate dockets.",
        sourceUrl: billUrl(117, "house", 6544, "/text"),
        sourceLabel: "H.R. 6544 text",
      },
    ],
    relatedBills: [
      { label: "H.R. 2732 (118th)", url: billUrl(118, "house", 2732) },
      { label: "S. 1207 (118th)", url: billUrl(118, "senate", 1207) },
      { label: "H.R. 6544 (117th)", url: billUrl(117, "house", 6544) },
      { label: "S. 3538 (117th)", url: billUrl(117, "senate", 3538) },
    ],
  },
  {
    id: "ai-child-safety",
    title: "AI and child exploitation safeguards",
    category: "Online Safety / Exploitation",
    overviewUrl: billUrl(119, "house", 1283),
    scope:
      "Proposals addressing AI-generated or AI-facilitated harms involving minors, including CSAM-related enforcement tools.",
    bullets: [
      {
        text: "H.R. 1283 addresses platform responsibilities related to harmful AI-generated content involving minors.",
        sourceUrl: billUrl(119, "house", 1283, "/text"),
        sourceLabel: "H.R. 1283 text",
      },
      {
        text: "H.R. 8005 proposes expert commission review of child exploitation and artificial intelligence.",
        sourceUrl: billUrl(118, "house", 8005, "/summary"),
        sourceLabel: "H.R. 8005 summary",
      },
    ],
    relatedBills: [
      { label: "H.R. 1283 (119th)", url: billUrl(119, "house", 1283) },
      { label: "H.R. 8005 (118th)", url: billUrl(118, "house", 8005) },
    ],
  },
  {
    id: "exploitation-enforcement",
    title: "Child exploitation enforcement",
    category: "Exploitation & Trafficking",
    overviewUrl: billUrl(119, "house", 2735),
    scope:
      "Measures that modify federal enforcement tools, penalties, or loophole closures for child exploitation offenses.",
    bullets: [
      {
        text: "Strengthening Child Exploitation Enforcement Act drafts enhance federal enforcement authorities against child exploitation crimes.",
        sourceUrl: billUrl(119, "house", 2735, "/text"),
        sourceLabel: "H.R. 2735 text",
      },
      {
        text: "Senate companion and prior-session texts track the same enforcement subject area.",
        sourceUrl: billUrl(119, "senate", 1333, "/text"),
        sourceLabel: "S. 1333 text",
      },
      {
        text: "S. 4708 (118th) advanced on the Senate floor as a strengthening-enforcement measure in this category.",
        sourceUrl: billUrl(118, "senate", 4708, "/summary"),
        sourceLabel: "S. 4708 summary",
      },
    ],
    relatedBills: [
      { label: "H.R. 2735 (119th)", url: billUrl(119, "house", 2735) },
      { label: "S. 1333 (119th)", url: billUrl(119, "senate", 1333) },
      { label: "S. 4708 (118th)", url: billUrl(118, "senate", 4708) },
    ],
  },
  {
    id: "sexual-predators",
    title: "Sexual predator accountability & registration tools",
    category: "Predator Accountability / Sex Offender Registration",
    overviewUrl: billUrl(119, "house", 134),
    scope:
      "Bills that adjust penalties, accountability mechanisms, or tools aimed at offenders who sexually exploit children.",
    bullets: [
      {
        text: "Protecting our Communities from Sexual Predators Act language addresses penalties and enforcement against sexual predators.",
        sourceUrl: billUrl(119, "house", 134, "/text"),
        sourceLabel: "H.R. 134 text",
      },
      {
        text: "Holding Child Predators Accountable Act drafts increase accountability measures for offenders who target children.",
        sourceUrl: billUrl(119, "house", 394, "/text"),
        sourceLabel: "H.R. 394 text",
      },
      {
        text: "Targeting Child Predators Act drafts include law-enforcement tools related to predators who exploit children.",
        sourceUrl: billUrl(119, "house", 3537, "/text"),
        sourceLabel: "H.R. 3537 text",
      },
      {
        text: "Related accountability drafts (e.g., Child Predators Accountability Act) appear in the same subject cluster.",
        sourceUrl: billUrl(119, "house", 6715, "/text"),
        sourceLabel: "H.R. 6715 text",
      },
    ],
    relatedBills: [
      { label: "H.R. 134 (119th)", url: billUrl(119, "house", 134) },
      { label: "H.R. 394 (119th)", url: billUrl(119, "house", 394) },
      { label: "H.R. 3537 (119th)", url: billUrl(119, "house", 3537) },
      { label: "H.R. 6715 (119th)", url: billUrl(119, "house", 6715) },
    ],
  },
  {
    id: "trafficking-victims",
    title: "Trafficking prevention & victim support",
    category: "Exploitation & Trafficking / Victim Support",
    overviewUrl: billUrl(119, "house", 4929),
    scope:
      "Reauthorizations and programs for trafficking prevention, detection, victim services, and related child-protection systems.",
    bullets: [
      {
        text: "Enduring Justice for Victims of Trafficking Act drafts address victim support and prosecution-related tools.",
        sourceUrl: billUrl(119, "house", 4929, "/text"),
        sourceLabel: "H.R. 4929 text",
      },
      {
        text: "Frederick Douglass Trafficking Victims Prevention and Protection Reauthorization Acts reauthorize federal anti-trafficking programs.",
        sourceUrl: billUrl(118, "house", 5856, "/summary"),
        sourceLabel: "H.R. 5856 summary",
      },
      {
        text: "Enhancing Detection of Human Trafficking Act language focuses on detection and reporting improvements.",
        sourceUrl: billUrl(118, "house", 443, "/text"),
        sourceLabel: "H.R. 443 text",
      },
      {
        text: "Preventing Child Trafficking Act drafts (House and Senate) address prevention of child trafficking.",
        sourceUrl: billUrl(119, "senate", 1049, "/text"),
        sourceLabel: "S. 1049 text",
      },
      {
        text: "Native American Child Protection Act strengthens child-protection service capacity in Native communities.",
        sourceUrl: billUrl(118, "house", 663, "/text"),
        sourceLabel: "H.R. 663 text",
      },
    ],
    relatedBills: [
      { label: "H.R. 4929 (119th)", url: billUrl(119, "house", 4929) },
      { label: "H.R. 5856 (118th)", url: billUrl(118, "house", 5856) },
      { label: "H.R. 6552 (117th)", url: billUrl(117, "house", 6552) },
      { label: "H.R. 443 (118th)", url: billUrl(118, "house", 443) },
      { label: "S. 1049 / H.R. 6475 (119th)", url: billUrl(119, "senate", 1049) },
      { label: "H.R. 663 (118th)", url: billUrl(118, "house", 663) },
    ],
  },
  {
    id: "ssa-child-protection",
    title: "Social Security Child Protection Act",
    category: "Victim Support & Justice",
    overviewUrl: billUrl(119, "house", 5348),
    scope:
      "Provisions concerning children in Social Security disability benefit determinations.",
    bullets: [
      {
        text: "Addresses protections for children in Social Security disability benefit determinations as drafted in the bill text.",
        sourceUrl: billUrl(119, "house", 5348, "/text"),
        sourceLabel: "H.R. 5348 text",
      },
      {
        text: "Official overview and actions for H.R. 5348 are on Congress.gov.",
        sourceUrl: billUrl(119, "house", 5348, "/summary"),
        sourceLabel: "H.R. 5348 summary",
      },
    ],
    relatedBills: [{ label: "H.R. 5348 (119th)", url: billUrl(119, "house", 5348) }],
  },
];
