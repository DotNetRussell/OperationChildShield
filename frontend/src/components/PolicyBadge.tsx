import Image from "next/image";

const BADGE_DIMENSIONS = {
  inline: { width: 699, height: 762 },
  notInline: { width: 639, height: 712 },
} as const;

interface PolicyBadgeProps {
  consistent: boolean | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

export function PolicyBadge({
  consistent,
  size = "md",
  className = "",
}: PolicyBadgeProps) {
  if (consistent == null) return null;

  const isInline = consistent;
  const src = isInline ? "/images/ocs_inline.png" : "/images/ocs_not_inline.png";
  const dims = isInline ? BADGE_DIMENSIONS.inline : BADGE_DIMENSIONS.notInline;
  const alt = isInline
    ? "Consistent with OCS board-adopted policy position"
    : "Not consistent with OCS board-adopted policy position";
  const heightClass = size === "sm" ? "h-7" : "h-8";

  return (
    <Image
      src={src}
      alt={alt}
      width={dims.width}
      height={dims.height}
      title={alt}
      className={`${heightClass} w-auto shrink-0 ${className}`}
    />
  );
}