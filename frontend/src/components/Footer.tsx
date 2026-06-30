import { ENABLE_BOARD_PAGE } from "@/lib/feature-flags";

export function Footer() {
  return (
    <footer className="bg-blue text-white text-center py-10 px-4 text-[0.95rem]">
      <p className="m-0">
        <strong>One Nation Under God • United in Defense of Our Children</strong>
      </p>
      <p className="mt-3 mb-0 opacity-85">
        Data from Congress.gov Public API • Transparency for We the People
      </p>
      <p className="mt-3 mb-0 text-sm opacity-85 flex flex-wrap justify-center gap-x-4 gap-y-1">
        <a href="/partners" className="underline hover:opacity-100">
          Our Partners
        </a>
        {ENABLE_BOARD_PAGE && (
          <a href="/board" className="underline hover:opacity-100">
            Board of Directors
          </a>
        )}
        <a href="/disclaimer" className="underline hover:opacity-100">
          Legal Disclaimer
        </a>
      </p>
      <p className="mt-3 mb-0 text-xs opacity-70 max-w-xl mx-auto">
        For entertainment purposes only. Data sourced from public records. Questions
        or disputes:{" "}
        <a
          href="mailto:Contact@OperationChildShield.com"
          className="underline hover:opacity-100"
        >
          Contact@OperationChildShield.com
        </a>
        .
      </p>
      <p className="mt-3 mb-0 text-xs opacity-70">
        Not affiliated with the U.S. Government. Always verify at{" "}
        <a
          href="https://www.congress.gov"
          className="underline hover:opacity-100"
          target="_blank"
          rel="noopener noreferrer"
        >
          Congress.gov
        </a>
        .
      </p>
    </footer>
  );
}