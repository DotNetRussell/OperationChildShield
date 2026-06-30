import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DonationForm } from "@/components/DonationForm";
import { ENABLE_DONATE_PAGE } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support Operation Child Shield — help fund nonpartisan congressional accountability tools that protect America's children.",
};

export default function DonatePage() {
  if (!ENABLE_DONATE_PAGE) notFound();

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-10">
      <Link href="/" className="text-sm text-muted hover:text-blue">
        ← Back to search
      </Link>

      <h1 className="text-3xl font-bold text-blue mt-4">Support Our Mission</h1>
      <p className="mt-3 text-muted leading-relaxed max-w-2xl">
        Operation Child Shield is building a lasting public record of how Congress
        votes on child protection. Choose a suggested donation below to preview the
        experience — payment processing is not yet connected.
      </p>

      <div className="mt-10">
        <DonationForm />
      </div>
    </div>
  );
}