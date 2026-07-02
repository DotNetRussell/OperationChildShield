"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PartyBadge } from "@/components/PartyBadge";
import { ShareButton } from "@/components/ShareButton";
import { StateBadge } from "@/components/StateBadge";
import {
  formatDisplayName,
  formatMemberSubtitle,
  gradeCircleClass,
  voteToLabel,
} from "@/lib/format";
import { hasKnownParty } from "@/lib/party";
import { reportCardQueue } from "@/lib/fetch-queue";
import { resolveParty } from "@/lib/party";
import type { MemberSummary, ReportCard } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PoliticianCardProps {
  member: MemberSummary;
  loadScores?: boolean;
}

export function PoliticianCard({ member, loadScores = true }: PoliticianCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<ReportCard | null>(null);
  const [visible, setVisible] = useState(false);

  const displayName = formatDisplayName(member.name);
  const subtitle = formatMemberSubtitle(member);
  const party = resolveParty(member.party, report?.party);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !loadScores) return;

    let cancelled = false;

    const markVisible = () => {
      if (!cancelled) setVisible(true);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          markVisible();
          observer.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0 }
    );

    observer.observe(el);

    const rect = el.getBoundingClientRect();
    const inView =
      rect.top < window.innerHeight + 200 && rect.bottom > -200;
    if (inView) {
      markVisible();
      observer.disconnect();
    }

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [loadScores, member.bioguideId]);

  useEffect(() => {
    if (!visible || !loadScores) return;

    let cancelled = false;

    reportCardQueue
      .enqueue(async () => {
        const res = await fetch(
          `${API_URL}/api/members/${member.bioguideId}/report-card`
        );
        if (!res.ok) throw new Error(`Failed to load report card: ${res.status}`);
        return res.json() as Promise<ReportCard>;
      })
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch(() => {
        /* scores unavailable */
      });

    return () => {
      cancelled = true;
    };
  }, [visible, loadScores, member.bioguideId]);

  const grade = report?.letter_grade ?? member.letterGrade ?? "—";
  const score = report ? `${report.score_percent}%` : "—";

  const keyVotes = (report?.key_votes ?? [])
    .filter((v) => v.vote_cast !== "Unknown")
    .slice(0, 3);

  return (
    <div
      ref={cardRef}
      className="flex h-full w-full flex-col overflow-visible rounded-[10px] bg-surface shadow-[0_6px_12px_-2px_rgb(0_0_0_/_0.1)] transition-all duration-[0.25s] border border-card-border hover:-translate-y-1.5 hover:shadow-[0_20px_25px_-5px_rgb(0_0_0_/_0.15)]"
    >
      <div className="overflow-hidden rounded-t-[10px] bg-gradient-to-r from-blue to-blue-light p-4 px-5 text-white">
        <div className="flex items-start gap-3">
          <div className="w-[58px] h-[58px] rounded-full bg-white shrink-0 flex items-center justify-center text-[1.9rem] border-[3px] border-white overflow-hidden">
            {member.imageUrl ? (
              <Image
                src={member.imageUrl}
                alt={displayName}
                width={58}
                height={58}
                className="object-cover w-full h-full"
              />
            ) : (
              <span>🇺🇸</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[1.2rem] font-bold leading-tight truncate">
              {displayName}
            </div>
            <div className="text-[#cbd5e1] text-[0.9rem] truncate">{subtitle}</div>
            {hasKnownParty(party) && (
              <div className="mt-2">
                <PartyBadge party={party} variant="header" size="md" />
              </div>
            )}
          </div>
          <div
            className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl font-black shrink-0 border-[4px] border-white text-white ${gradeCircleClass(grade)}`}
          >
            {grade}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/25 flex items-center justify-between gap-2 flex-wrap">
          <StateBadge
            stateName={member.state}
            stateCode={member.stateCode}
            variant="header"
          />
          <span className="text-xs font-semibold text-blue-100 uppercase tracking-wide">
            {member.chamber}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-5">
        {hasKnownParty(party) && (
          <div className="mb-4 flex shrink-0 justify-end border-b border-card-border pb-3">
            <div className="flex flex-col items-end gap-1">
              <PartyBadge party={party} variant="light" />
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">
                Party Affiliation
              </span>
            </div>
          </div>
        )}

        <div className="flex shrink-0 items-baseline gap-1.5">
          <span className="text-[2.25rem] font-extrabold text-blue font-mono leading-none">
            {score}
          </span>
          <span className="text-text-subtle text-[0.95rem]">Protection Score</span>
        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col text-[0.9rem]">
          <strong className="block my-2 mb-2.5 text-red text-[0.85rem]">
            KEY VOTES
          </strong>
          {!report && (
            <div className="text-muted text-sm py-2 px-3 bg-surface-muted rounded-md border-l-4 border-red">
              Open the full report for vote details.
            </div>
          )}
          {report && keyVotes.length === 0 && (
            <div className="text-muted text-sm py-2 px-3 bg-surface-muted rounded-md border-l-4 border-red">
              {member.chamber === "Senate"
                ? "Senate floor votes are not yet available via Congress.gov API."
                : "No floor votes on tracked child protection bills yet."}
            </div>
          )}
          {keyVotes.map((bill) => {
            const vote = voteToLabel(bill.vote_cast);
            return (
              <div
                key={bill.bill_id}
                className="py-2.5 px-3.5 bg-surface-muted mb-2 rounded-md flex justify-between items-center border-l-4 border-red"
              >
                <div className="flex-1 pr-2 text-sm leading-snug">
                  {bill.bill_title.length > 48
                    ? `${bill.bill_title.slice(0, 48)}…`
                    : bill.bill_title}
                </div>
                <div
                  className={`font-bold px-2.5 py-0.5 rounded-full text-[0.8rem] shrink-0 ${vote.className}`}
                >
                  {vote.label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex shrink-0 flex-col gap-2">
          <ShareButton
            bioguideId={member.bioguideId}
            name={member.name}
            party={party}
            letterGrade={grade}
            scorePercent={report?.score_percent}
            votesScored={report?.votes_scored}
            votesTracked={report?.votes_tracked}
            keyVotes={report?.key_votes}
            chamber={member.chamber}
          />
          <Link
            href={`/member/${member.bioguideId}`}
            className="block w-full py-3.5 bg-red text-white border-none rounded-md font-bold text-center no-underline hover:bg-[#991b1b] transition-colors"
          >
            FULL REPORT →
          </Link>
        </div>
      </div>
    </div>
  );
}