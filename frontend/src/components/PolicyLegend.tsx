import Image from "next/image";

export function PolicyLegend({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted ${className}`}
    >
      <span className="inline-flex items-center gap-2">
        <Image
          src="/images/ocs_inline.png"
          alt=""
          width={699}
          height={762}
          aria-hidden
          className="h-8 w-auto"
        />
        Consistent with OCS policy
      </span>
      <span className="inline-flex items-center gap-2">
        <Image
          src="/images/ocs_not_inline.png"
          alt=""
          width={639}
          height={712}
          aria-hidden
          className="h-8 w-auto"
        />
        Not consistent with OCS policy
      </span>
    </div>
  );
}