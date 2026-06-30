"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildSharePayload, type ShareReportInput } from "@/lib/share";

interface ShareButtonProps extends ShareReportInput {
  className?: string;
  variant?: "card" | "report";
}

function ShareIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
    </svg>
  );
}

export function ShareButton({
  className = "",
  variant = "card",
  ...input
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const payload = buildSharePayload(input);

  const showFeedback = useCallback((message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2000);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function copyToClipboard(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      showFeedback(successMessage);
      setOpen(false);
    } catch {
      showFeedback("Copy failed");
    }
  }

  const baseButtonClass =
    variant === "report"
      ? "inline-flex items-center justify-center gap-2 rounded-md border border-blue bg-surface px-4 py-2.5 text-sm font-bold text-blue transition-colors hover:bg-blue/5"
      : "inline-flex w-full items-center justify-center gap-2 rounded-md border border-card-border bg-surface px-4 py-3 text-sm font-bold text-blue transition-colors hover:bg-surface-muted";

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={baseButtonClass}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <ShareIcon />
        {feedback ?? "Share"}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-md border border-card-border bg-surface shadow-[0_10px_25px_-5px_rgb(0_0_0_/_0.15)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => copyToClipboard(payload.url, "Link copied!")}
            className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-foreground hover:bg-surface-muted"
          >
            Copy link to report
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => copyToClipboard(payload.text, "Message copied!")}
            className="block w-full border-t border-card-border px-4 py-2.5 text-left text-sm font-semibold text-foreground hover:bg-surface-muted"
          >
            Copy message with link
          </button>
        </div>
      )}
    </div>
  );
}