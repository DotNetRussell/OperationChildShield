import { NCMEC } from "@/lib/ncmec";

interface NcmecReportBannerProps {
  /** Compact strip for headers/footers vs full card */
  variant?: "banner" | "card";
  className?: string;
}

export function NcmecReportBanner({
  variant = "banner",
  className = "",
}: NcmecReportBannerProps) {
  if (variant === "card") {
    return (
      <aside
        className={`rounded-[10px] border border-card-border bg-surface p-6 shadow-sm ${className}`}
        aria-label="Report missing or exploited children"
      >
        <p className="m-0 text-xs font-bold uppercase tracking-wider text-red">
          Reporting resource
        </p>
        <h2 className="m-0 mt-2 text-xl font-bold text-blue">{NCMEC.name}</h2>
        <p className="mt-3 text-sm text-muted leading-relaxed m-0">{NCMEC.description}</p>
        <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-3">
          <a
            href={NCMEC.reportExploitationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-red px-4 py-2.5 text-sm font-bold text-white no-underline hover:opacity-90"
          >
            Report Abuse Now →
          </a>
          <a
            href={NCMEC.cyberTiplineInfoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-card-border bg-surface px-4 py-2.5 text-sm font-bold text-blue no-underline hover:bg-surface-muted"
          >
            How Reporting Works
          </a>
          <a
            href={`tel:${NCMEC.hotlineTel}`}
            className="inline-flex items-center justify-center rounded-md border border-card-border bg-surface px-4 py-2.5 text-sm font-bold text-blue no-underline hover:bg-surface-muted"
          >
            Call {NCMEC.hotlineDisplay}
          </a>
        </div>
        <p className="mt-4 m-0 text-xs text-muted">
          Also:{" "}
          <a
            href={NCMEC.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red font-semibold hover:underline"
          >
            missingkids.org
          </a>
          {" · "}
          <a
            href={NCMEC.missingChildInfoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red font-semibold hover:underline"
          >
            Get help now
          </a>
        </p>
      </aside>
    );
  }

  return (
    <div
      className={`bg-red text-white text-center text-sm px-4 py-2.5 ${className}`}
      role="region"
      aria-label="NCMEC reporting quick link"
    >
      <span className="font-semibold">See something? Report it.</span>{" "}
      <a
        href={NCMEC.reportExploitationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-bold hover:opacity-90"
      >
        Open CyberTipline
      </a>
      <span className="opacity-80"> · </span>
      <a
        href={`tel:${NCMEC.hotlineTel}`}
        className="underline font-bold hover:opacity-90"
      >
        {NCMEC.hotlineDisplay}
      </a>
      <span className="opacity-80 hidden sm:inline">
        {" "}
        (National Center for Missing &amp; Exploited Children)
      </span>
    </div>
  );
}
