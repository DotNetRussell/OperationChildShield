import Image from "next/image";
import Link from "next/link";
import { MemberContactCard } from "@/components/MemberContactCard";
import { ShareButton } from "@/components/ShareButton";
import { VoteTable } from "@/components/VoteTable";
import { PartyBadge } from "@/components/PartyBadge";
import { StateBadge } from "@/components/StateBadge";
import { formatDisplayName, gradeCircleClass } from "@/lib/format";
import { getReportCard } from "@/lib/api";

interface MemberPageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { id } = await params;

  let card: Awaited<ReturnType<typeof getReportCard>> | null = null;
  let error: string | null = null;

  try {
    card = await getReportCard(id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load report card";
  }

  if (error || !card) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-blue">Member Not Found</h1>
        <p className="mt-2 text-muted">{error}</p>
        <Link href="/" className="mt-6 inline-block text-red font-bold hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  const displayName = formatDisplayName(card.name);
  const prefix = card.chamber === "Senate" ? "Sen." : "Rep.";
  const subtitle = `${prefix} ${card.state}${card.district ? `-${card.district}` : ""}`;


  return (
    <div className="max-w-[900px] mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-muted hover:text-blue transition-colors">
        ← Back to search
      </Link>

      <div className="mt-6 overflow-visible rounded-[10px] border border-card-border bg-surface shadow-[0_6px_12px_-2px_rgb(0_0_0_/_0.1)]">
        <div className="flex items-center gap-4 overflow-hidden rounded-t-[10px] bg-gradient-to-r from-blue to-blue-light p-5 px-6 text-white">
          <div className="w-[72px] h-[72px] rounded-full bg-white shrink-0 flex items-center justify-center text-3xl border-[3px] border-white overflow-hidden">
            {card.image_url ? (
              <Image
                src={card.image_url}
                alt={displayName}
                width={72}
                height={72}
                className="object-cover w-full h-full"
              />
            ) : (
              <span>🇺🇸</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold m-0">{displayName}</h1>
            <p className="text-[#cbd5e1] m-0 mt-0.5">{subtitle}</p>
            <div className="mt-2">
              <PartyBadge party={card.party} variant="header" />
            </div>
          </div>
          <div
            className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-black border-[5px] border-white text-white ${gradeCircleClass(card.letter_grade)}`}
          >
            {card.letter_grade}
          </div>
        </div>

        <div className="px-6 py-4 border-b border-card-border flex flex-wrap items-center justify-between gap-3">
          <StateBadge stateName={card.state} variant="light" />
          <PartyBadge party={card.party} variant="light" />
        </div>

        <div className="p-6">
          <div className="flex items-baseline gap-2">
            <span className="text-[2.75rem] font-extrabold text-blue font-mono leading-none">
              {card.score_percent}%
            </span>
            <span className="text-text-subtle">Protection Score</span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="bg-surface-muted rounded-lg p-4 border border-card-border">
              <p className="text-2xl font-bold text-blue m-0">{card.votes_scored}</p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Votes Scored</p>
            </div>
            <div className="bg-surface-muted rounded-lg p-4 border border-card-border">
              <p className="text-2xl font-bold text-blue m-0">{card.votes_tracked}</p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Bills Tracked</p>
            </div>
            <div className="bg-surface-muted rounded-lg p-4 border border-card-border">
              <p className="text-2xl font-bold text-blue m-0">{card.letter_grade}</p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Letter Grade</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ShareButton
              variant="report"
              bioguideId={card.bioguide_id}
              name={card.name}
              party={card.party}
              letterGrade={card.letter_grade}
              scorePercent={card.score_percent}
              votesScored={card.votes_scored}
              votesTracked={card.votes_tracked}
              keyVotes={card.key_votes}
              chamber={card.chamber}
            />
            <a
              href={card.congress_profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-red hover:underline"
            >
              View official profile on Congress.gov →
            </a>
          </div>

          {card.contact && <MemberContactCard contact={card.contact} />}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-blue mb-4">All Key Votes on Child Protection</h2>
        <div className="bg-surface rounded-[10px] p-5 shadow-[0_6px_12px_-2px_rgb(0_0_0_/_0.1)] border border-card-border">
          <VoteTable votes={card.key_votes} />
        </div>
      </div>
    </div>
  );
}