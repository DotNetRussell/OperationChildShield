import type { Metadata } from "next";
import Link from "next/link";
import { InvolveForm } from "@/components/InvolveForm";

export const metadata: Metadata = {
  title: "Join Us",
  description:
    "Volunteer, advocate, or partner with Operation Child Shield.",
  openGraph: {
    title: "Join Us | Operation Child Shield",
    description:
      "Volunteer, advocate, or partner with Operation Child Shield.",
  },
};

export default function GetInvolvedPage() {
  return (
    <div className="page-container py-8">
      <Link href="/learn" className="text-sm text-muted hover:text-blue">
        ← How it works
      </Link>

      <h1 className="text-3xl font-bold text-blue mt-4">Your Move</h1>
      <p className="mt-4 text-muted leading-relaxed">
        Protect | Educate | Mobilize. Tell us how you want to help: volunteering,
        contacting lawmakers, media, or partnerships. We store signups for
        follow-up and never sell your information.
      </p>
      <p className="mt-2 text-sm text-muted">
        Prefer email?{" "}
        <a
          href="mailto:Contact@OperationChildShield.com"
          className="text-red font-semibold hover:underline"
        >
          Contact@OperationChildShield.com
        </a>
      </p>

      <div className="mt-8 relative">
        <InvolveForm />
      </div>
    </div>
  );
}
