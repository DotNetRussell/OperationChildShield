"use client";

import { useCallback, useState } from "react";
import {
  buildEmailShareUrl,
  buildFacebookShareUrl,
  buildLinkedInShareUrl,
  buildXShareUrl,
} from "@/lib/social";

export interface ShareLinksProps {
  title: string;
  text: string;
  url: string;
  className?: string;
}

export function ShareLinks({ title, text, url, className = "" }: ShareLinksProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = useCallback((message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2000);
  }, []);

  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      showFeedback(message);
    } catch {
      showFeedback("Copy failed");
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* user cancelled or unsupported - fall through */
      }
    }
    await copy(`${text}\n\n${url}`, "Message copied!");
  }

  const itemClass =
    "inline-flex items-center justify-center rounded-md border border-card-border bg-surface px-3 py-2 text-xs font-semibold text-blue no-underline hover:bg-surface-muted transition-colors";

  return (
    <div className={className}>
      <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Spread the Word
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={itemClass} onClick={() => void nativeShare()}>
          {feedback ?? "Share This"}
        </button>
        <a
          className={itemClass}
          href={buildXShareUrl(text, url)}
          target="_blank"
          rel="noopener noreferrer"
        >
          X
        </a>
        <a
          className={itemClass}
          href={buildFacebookShareUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Facebook
        </a>
        <a
          className={itemClass}
          href={buildLinkedInShareUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
        <a className={itemClass} href={buildEmailShareUrl(title, text, url)}>
          Email
        </a>
        <button
          type="button"
          className={itemClass}
          onClick={() => void copy(url, "Link copied!")}
        >
          Copy link
        </button>
      </div>
    </div>
  );
}
