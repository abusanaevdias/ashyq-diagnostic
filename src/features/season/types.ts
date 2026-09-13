export type SeasonDivision = 'ielts' | 'sat';
export type SeasonPhase = 'opening' | 'qualifier' | 'final';
export type SeasonVenue = 'online' | 'offline';
export type SeasonView = 'overview' | 'live' | 'journey';

export interface SeasonConfig {
  id: string;
  name: string;
  status: 'active';
  week: number;
  totalWeeks: number;
  timezone: 'Asia/Almaty';
  leaderboardUpdatedAt: string;
}

export interface SeasonEvent {
  id: string;
  phase: SeasonPhase;
  venue: SeasonVenue;
  title: string;
  date: string;
  place: string;
  status: 'done' | 'live' | 'upcoming';
}

export interface TeamStanding {
  id: string;
  division: SeasonDivision;
  rank: number;
  name: string;
  city: string;
  points: number;
  trend: number;
}

export interface IndividualStanding {
  id: string;
  division: SeasonDivision;
  rank: number;
  alias: string;
  team: string;
  points: number;
  trend: number;
}

export interface ParticipantSeason {
  alias: string;
  division: SeasonDivision;
  team: string;
  teamRank: number;
  personalRank: number;
  weeklyPoints: number;
  weeklyGoal: number;
  score: Array<{ label: string; value: number; max: number }>;
}

export interface SeasonFixture {
  config: SeasonConfig;
  events: SeasonEvent[];
  teams: TeamStanding[];
  individuals: IndividualStanding[];
  participant: ParticipantSeason;
}
