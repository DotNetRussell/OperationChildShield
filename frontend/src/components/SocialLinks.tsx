import { getSocialLinks } from "@/lib/social";

interface SocialLinksProps {
  className?: string;
  /** Invert colors for dark footer backgrounds */
  variant?: "default" | "footer";
}

export function SocialLinks({ className = "", variant = "default" }: SocialLinksProps) {
  const links = getSocialLinks();
  if (links.length === 0) return null;

  const linkClass =
    variant === "footer"
      ? "underline hover:opacity-100 text-white/90"
      : "text-blue font-semibold hover:underline";

  return (
    <nav
      aria-label="Social media"
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 ${className}`}
    >
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
