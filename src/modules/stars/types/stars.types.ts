// Star Rewards (parent app). Everything shown is controlled by the school in
// SchoolTree → School Settings → Stars; `enabled: false` means "show nothing".

export type StarPeriod = 'week' | 'month' | 'year';
export type StarScope = 'off' | 'section' | 'class' | 'school';

export interface StarHistoryItem {
  id: number;
  stars: number;
  rule_key: string;
  source_type: 'MCQ' | 'MANUAL' | 'REVOKE' | string;
  reason: string | null;
  awarded_by: string | null;
  created_at: string; // 'YYYY-MM-DD HH:mm'
}

export interface StarPlace {
  rank: number;
  of: number;
  stars: number;
  /** Stars needed to pass the student just above (0 = already first). */
  behind_next: number;
}

export interface StarSummary {
  enabled: boolean;
  totals?: {year: number; month: number; week: number};
  /** This week's place. null when the leaderboard is off. */
  rank?: StarPlace | null;
  leaderboard?: {scope: StarScope; label: string | null};
  recent?: StarHistoryItem[];
}

export interface StarHistoryPage {
  enabled: boolean;
  page?: number;
  items?: StarHistoryItem[];
  has_more?: boolean;
}

export interface StarBoardRow {
  rank: number;
  name: string;
  section?: string;
  stars: number;
  is_me: boolean;
}

export interface StarLeaderboard {
  enabled: boolean;
  scope?: StarScope;
  label?: string | null;
  period?: StarPeriod;
  top?: StarBoardRow[];
  me?: StarPlace | null;
}

export interface StarsApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}
