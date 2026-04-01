export type TimetableType = 0 | 1 | 2; // 0=Regular, 1=Combined, 2=Split

export interface TimetableEntry {
  day_id: number;
  period_id: number;
  tt_type: TimetableType;
  group_id: string | null;
  subject_name: string;
  staff_name: string;
}

export interface TimetableResponse {
  status: boolean;
  message: string;
  data?: TimetableEntry[];
}

export const DAY_MAP: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

export const DAY_FULL_MAP: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const PERIOD_MAP: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
};

export const TT_TYPE_LABEL: Record<TimetableType, string> = {
  0: 'Regular',
  1: 'Combined',
  2: 'Split',
};
