import { afterEach, describe, expect, it } from "vitest";
import {
  buildEmailShareUrl,
  buildFacebookShareUrl,
  buildLinkedInShareUrl,
  buildXShareUrl,
  getSocialLinks,
} from "./social";

describe("share URL builders", () => {
  it("builds X intent URL", () => {
    const url = buildXShareUrl("Hello", "https://operationchildshield.org/member/1");
    expect(url).toContain("twitter.com/intent/tweet");
    expect(url).toContain(encodeURIComponent("Hello"));
  });

  it("builds Facebook sharer URL", () => {
    const url = buildFacebookShareUrl("https://operationchildshield.org");
    expect(url).toContain("facebook.com/sharer");
    expect(url).toContain(encodeURIComponent("https://operationchildshield.org"));
  });

  it("builds LinkedIn share URL", () => {
    const url = buildLinkedInShareUrl("https://operationchildshield.org/states/tx");
    expect(url).toContain("linkedin.com/sharing");
  });

  it("builds mailto URL", () => {
    const url = buildEmailShareUrl("Title", "Body text", "https://example.com");
    expect(url.startsWith("mailto:?")).toBe(true);
    expect(url).toContain("subject=Title");
  });
});

describe("getSocialLinks", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SOCIAL_X_URL;
    delete process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL;
  });

  it("returns only configured valid https links", () => {
    process.env.NEXT_PUBLIC_SOCIAL_X_URL = "https://x.com/example";
    process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL = "not-a-url";
    const links = getSocialLinks();
    expect(links).toHaveLength(1);
    expect(links[0].id).toBe("x");
  });
});
