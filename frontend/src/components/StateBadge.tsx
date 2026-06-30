"use client";

import { getStateCode, getStateMapImageUrl } from "@/lib/states";

interface StateBadgeProps {
  stateName: string;
  stateCode?: string;
  variant?: "light" | "header";
  compact?: boolean;
}

export function StateBadge({
  stateName,
  stateCode,
  variant = "light",
  compact = false,
}: StateBadgeProps) {
  const code = getStateCode(stateName, stateCode);
  const mapUrl = getStateMapImageUrl(stateName, stateCode);

  const isHeader = variant === "header";
  const textPrimary = isHeader ? "text-white" : "text-foreground";
  const textMuted = isHeader ? "text-blue-100" : "text-muted";

  const mapSize = compact ? "w-10 h-10" : "w-12 h-12";

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        className={`${mapSize} rounded-lg overflow-hidden shrink-0 flex items-center justify-center border-2 ${
          isHeader
            ? "border-white/50 bg-white shadow-sm"
            : "border-card-border bg-surface shadow-sm"
        }`}
      >
        {mapUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mapUrl}
            alt={`${stateName} map`}
            width={compact ? 40 : 48}
            height={compact ? 40 : 48}
            className="object-contain w-full h-full p-1"
          />
        ) : (
          <span
            className={`text-sm font-black ${isHeader ? "text-blue" : "text-blue"}`}
          >
            {code}
          </span>
        )}
      </div>
      <div className="min-w-0">
        {compact ? (
          <div className={`font-bold text-sm leading-none ${textPrimary}`}>{code}</div>
        ) : (
          <>
            <div className={`font-bold text-sm leading-tight truncate ${textPrimary}`}>
              {stateName}
            </div>
            <div className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}>
              {code}
            </div>
          </>
        )}
      </div>
    </div>
  );
}