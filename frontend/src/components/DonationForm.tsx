"use client";

import { useMemo, useState } from "react";

const SUGGESTED_AMOUNTS = [25, 50, 100, 250, 500, 1000] as const;

const IMPACT_ITEMS = [
  "Maintaining Congress.gov data pipelines and verification",
  "Expanding tracked child-protection legislation",
  "Building transparency tools for voters, journalists, and advocates",
  "Keeping the platform unbiased and publicly accessible",
] as const;

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DonationForm() {
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");

  const activeAmount = useMemo(() => {
    const parsed = parseInt(customAmount.replace(/\D/g, ""), 10);
    if (customAmount.trim() && !Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
    return selectedAmount;
  }, [customAmount, selectedAmount]);

  function selectPreset(amount: number) {
    setSelectedAmount(amount);
    setCustomAmount("");
  }

  function handleCustomChange(value: string) {
    setCustomAmount(value);
  }

  return (
    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
      <div className="bg-surface rounded-[10px] p-6 sm:p-8 border border-card-border shadow-[0_6px_12px_-2px_rgb(0_0_0_/_0.1)]">
        <h2 className="text-xl font-bold text-blue m-0">Choose your gift</h2>
        <p className="mt-2 text-sm text-muted m-0">
          Select a suggested amount or enter your own. Online payments are not
          connected yet. This preview shows the donation experience we are building.
        </p>

        <div className="mt-6 flex rounded-xl border-2 border-card-border p-1 bg-surface-muted">
          {(["once", "monthly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFrequency(option)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                frequency === option
                  ? "bg-blue text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {option === "once" ? "One-time" : "Monthly"}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SUGGESTED_AMOUNTS.map((amount) => {
            const isActive = !customAmount && selectedAmount === amount;
            return (
              <button
                key={amount}
                type="button"
                onClick={() => selectPreset(amount)}
                className={`relative py-4 rounded-xl border-2 font-bold text-lg transition-all ${
                  isActive
                    ? "border-blue bg-blue/5 text-blue shadow-sm scale-[1.02]"
                    : "border-card-border bg-surface text-foreground hover:border-blue/40 hover:bg-surface-muted"
                }`}
              >
                {amount === 50 && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-red text-white text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                    Popular
                  </span>
                )}
                {formatUsd(amount)}
              </button>
            );
          })}
        </div>

        <label className="block mt-6">
          <span className="text-sm font-semibold text-muted">Custom amount</span>
          <div className="mt-2 flex items-center rounded-xl border-2 border-card-border overflow-hidden bg-surface focus-within:border-blue">
            <span className="pl-4 text-muted font-semibold">$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="flex-1 px-3 py-3.5 border-none outline-none text-lg font-semibold bg-transparent"
            />
          </div>
        </label>

        <div className="mt-8 rounded-xl bg-surface-muted border border-card-border p-4">
          <p className="text-sm text-muted m-0">Your selection</p>
          <p className="mt-1 text-3xl font-bold text-blue m-0 tabular-nums">
            {formatUsd(activeAmount)}
            <span className="text-base font-semibold text-muted ml-2">
              {frequency === "once" ? "one-time" : "per month"}
            </span>
          </p>
        </div>

        <button
          type="button"
          disabled
          className="mt-6 w-full py-4 rounded-xl bg-red text-white font-bold text-lg opacity-80 cursor-not-allowed"
        >
          Donate {formatUsd(activeAmount)} (Coming Soon)
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          Payment processing will be added in a future release. No charges are made
          on this page.
        </p>
      </div>

      <div className="space-y-6">
        <section className="bg-surface rounded-[10px] p-6 border border-card-border shadow-sm">
          <h2 className="text-lg font-bold text-blue m-0">Why donate?</h2>
          <p className="mt-3 text-sm text-muted leading-relaxed m-0">
            Operation Child Shield turns public congressional voting data into
            actionable accountability tools. Your support helps us keep the platform
            independent, accurate, and free for the public.
          </p>
        </section>

        <section className="bg-surface rounded-[10px] p-6 border border-card-border shadow-sm">
          <h2 className="text-lg font-bold text-blue m-0">Where your gift goes</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted leading-relaxed list-disc pl-5 m-0">
            {IMPACT_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-[10px] p-6 border border-blue/20 bg-blue/5">
          <p className="text-sm text-foreground leading-relaxed m-0">
            <strong className="text-blue">Tax &amp; receipt note:</strong> Donation
            receipts and tax-deductibility details will be published here before
            payments go live.
          </p>
        </section>
      </div>
    </div>
  );
}