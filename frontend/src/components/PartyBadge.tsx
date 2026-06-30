import { formatPartyLabel } from "@/lib/format";
import { hasKnownParty } from "@/lib/party";

interface PartyBadgeProps {
  party: string;
  variant?: "header" | "light";
  size?: "sm" | "md";
}

export function PartyBadge({
  party,
  variant = "light",
  size = "md",
}: PartyBadgeProps) {
  if (!hasKnownParty(party)) {
    return null;
  }

  const label = formatPartyLabel(party);
  const lower = label.toLowerCase();

  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-[0.7rem]"
      : "px-3 py-1 text-xs";

  if (variant === "header") {
    if (lower === "democrat") {
      return (
        <span
          className={`inline-block rounded-full font-bold uppercase tracking-wide border bg-white text-blue-800 border-white shadow-sm ${sizeClass}`}
        >
          {label}
        </span>
      );
    }
    if (lower === "republican") {
      return (
        <span
          className={`inline-block rounded-full font-bold uppercase tracking-wide border bg-red-600 text-white border-red-700 ${sizeClass}`}
        >
          {label}
        </span>
      );
    }
    if (lower === "independent") {
      return (
        <span
          className={`inline-block rounded-full font-bold uppercase tracking-wide border bg-purple-100 text-purple-900 border-purple-200 ${sizeClass}`}
        >
          {label}
        </span>
      );
    }
    return (
      <span
        className={`inline-block rounded-full font-bold uppercase tracking-wide border bg-white/90 text-slate-700 border-white/80 ${sizeClass}`}
      >
        {label}
      </span>
    );
  }

  if (lower === "democrat") {
    return (
      <span
        className={`inline-block rounded-full font-bold uppercase tracking-wider border bg-blue-100 text-blue-800 border-blue-300 ${sizeClass}`}
      >
        {label}
      </span>
    );
  }
  if (lower === "republican") {
    return (
      <span
        className={`inline-block rounded-full font-bold uppercase tracking-wider border bg-red-100 text-red-800 border-red-300 ${sizeClass}`}
      >
        {label}
      </span>
    );
  }
  if (lower === "independent") {
    return (
      <span
        className={`inline-block rounded-full font-bold uppercase tracking-wider border bg-purple-100 text-purple-800 border-purple-300 ${sizeClass}`}
      >
        {label}
      </span>
    );
  }
  return (
    <span
      className={`inline-block rounded-full font-bold uppercase tracking-wider border bg-surface-subtle text-text-subtle border-card-border ${sizeClass}`}
    >
      {label}
    </span>
  );
}