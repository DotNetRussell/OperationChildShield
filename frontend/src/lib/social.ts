/** Optional public social profile URLs (empty = hide that network). */
export interface SocialLink {
  id: string;
  label: string;
  href: string;
}

function envUrl(key: string): string {
  const value = process.env[key]?.trim() ?? "";
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function getSocialLinks(): SocialLink[] {
  const candidates: { id: string; label: string; env: string }[] = [
    { id: "x", label: "X (Twitter)", env: "NEXT_PUBLIC_SOCIAL_X_URL" },
    { id: "facebook", label: "Facebook", env: "NEXT_PUBLIC_SOCIAL_FACEBOOK_URL" },
    { id: "instagram", label: "Instagram", env: "NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL" },
    { id: "youtube", label: "YouTube", env: "NEXT_PUBLIC_SOCIAL_YOUTUBE_URL" },
    { id: "linkedin", label: "LinkedIn", env: "NEXT_PUBLIC_SOCIAL_LINKEDIN_URL" },
  ];

  return candidates
    .map(({ id, label, env }) => ({ id, label, href: envUrl(env) }))
    .filter((link) => link.href.length > 0);
}

export function buildXShareUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text: `${text}\n\n${url}` });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function buildFacebookShareUrl(url: string): string {
  const params = new URLSearchParams({ u: url });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

export function buildLinkedInShareUrl(url: string): string {
  const params = new URLSearchParams({ url });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

export function buildEmailShareUrl(title: string, text: string, url: string): string {
  const params = new URLSearchParams({
    subject: title,
    body: `${text}\n\n${url}`,
  });
  return `mailto:?${params.toString()}`;
}
