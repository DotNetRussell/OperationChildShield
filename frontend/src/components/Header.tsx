import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ENABLE_BOARD_PAGE } from "@/lib/feature-flags";

const NAV_LINKS = [
  { href: "/bills", label: "Tracked Bills" },
  { href: "/metrics", label: "Metrics" },
  { href: "/about", label: "Methodology" },
  { href: "/partners", label: "Partners" },
  ...(ENABLE_BOARD_PAGE ? [{ href: "/board", label: "Board" }] : []),
  { href: "/disclaimer", label: "Disclaimer" },
] as const;

export function Header() {
  return (
    <header className="hero-header relative">
      <div className="absolute top-4 right-4 z-[3]">
        <ThemeToggle />
      </div>
      <div className="relative z-[2] w-full max-w-[900px] px-4 py-6 sm:py-0">
        <Link href="/" className="block text-white no-underline hover:opacity-95 transition-opacity">
          <div className="text-4xl sm:text-5xl mb-1 sm:mb-2">🛡️</div>
          <h1 className="text-[1.75rem] leading-[1.1] sm:text-[3.3rem] m-0 font-bold tracking-[-1px] sm:tracking-[-2px] [text-shadow:0_4px_12px_rgba(0,0,0,0.7)]">
            OPERATION CHILD SHIELD
          </h1>
          <p className="text-sm sm:text-[1.3rem] opacity-95 m-0 mt-2 sm:mt-1 font-medium leading-snug sm:leading-normal [text-shadow:0_2px_8px_rgba(0,0,0,0.8)] max-w-[36rem] mx-auto">
            <span className="block sm:inline">Unbiased • Nonpartisan</span>
            <span className="hidden sm:inline"> • </span>
            <span className="block sm:inline">Protecting America&apos;s Children</span>
          </p>
        </Link>
        <nav
          aria-label="Main navigation"
          className="mt-5 sm:mt-6 flex flex-wrap justify-center items-center gap-2 sm:gap-3"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center justify-center min-w-[7.5rem] px-4 py-2 rounded-full text-sm font-semibold text-white bg-white/10 border border-white/25 backdrop-blur-sm hover:bg-white/20 hover:border-white/40 transition-colors no-underline"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}