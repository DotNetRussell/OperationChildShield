export interface MemberSummary {
  bioguideId: string;
  name: string;
  chamber: string;
  state: string;
  stateCode?: string;
  party: string;
  district: string | number | null;
  imageUrl: string | null;
  congressUrl: string;
}

export interface MemberContact {
  office_address: string | null;
  phone: string | null;
  city: string | null;
  zip_code: string | number | null;
  website_url: string | null;
}

export interface MemberVote {
  bill_id: string;
  bill_title: string;
  bill_number: string;
  category: string;
  vote_cast: string;
  vote_date: string | null;
  vote_question: string | null;
  vote_result: string | null;
  congress_url: string;
  roll_call_url: string | null;
  score_impact: string;
  policy_consistent: boolean | null;
}

export interface ReportCard {
  bioguide_id: string;
  name: string;
  chamber: string;
  state: string;
  party: string;
  district: string | null;
  image_url: string | null;
  votes_tracked: number;
  key_votes: MemberVote[];
  congress_profile_url: string;
  contact: MemberContact | null;
}

export interface TrackedBill {
  id: string;
  congress: number;
  number: string;
  title: string;
  category: string;
  description: string;
  congressUrl: string;
  floorStatus: string;
  floorStatusLabel: string;
  scorable: boolean;
}