/** How an attempt ended (server). IN_PROGRESS = started, not finished yet. */
export type McqAttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'TIME_UP' | 'LEFT_APP';

/** List state: not started yet (by date) or the attempt status. */
export type McqTestState = 'AVAILABLE' | 'UPCOMING' | 'MISSED' | McqAttemptStatus;

export type McqFinishReason = 'SUBMITTED' | 'TIME_UP' | 'LEFT_APP';

export interface McqResultSummary {
  status: McqAttemptStatus;
  close_reason: string | null;
  total: number;
  attended: number;
  not_answered: number;
  /** false until the teacher publishes the paper's results; correct / wrong are absent then. */
  results_published: boolean;
  correct?: number;
  wrong?: number;
  started_at: string;
  finished_at: string | null;
  time_taken_seconds: number | null;
}

export interface McqTest {
  qus_paper_id: number;
  qus_paper_name: string;
  sub_name: string;
  qus_date: string; // YYYY-MM-DD
  qus_count: number;
  duration_min: number;
  state: McqTestState;
  /** The teacher allowed this test again; qus_date is then the retake date. */
  retake?: boolean;
  result: McqResultSummary | null;
}

export interface McqExamQuestion {
  qus_id: number;
  qus_name: string;
  qus_image: string | null;
  opt1: string;
  opt2: string;
  opt3: string;
  opt4: string;
  qus_type: 'text' | 'img';
}

export interface McqStartedExam {
  qus_paper_id: number;
  qus_paper_name: string;
  sub_name: string;
  duration_min: number;
  remaining_seconds: number;
  /** qus_id → '1'-'4', answers already saved (only on a retried start). */
  answers: Record<string, string>;
  questions: McqExamQuestion[];
}

export interface McqResultQuestion extends McqExamQuestion {
  attend: string | null; // '' = not answered
  /** Only when results are published. */
  exp?: string | null;
  correct_ans?: string | null;
}

export interface McqExamResult {
  qus_paper_id: number;
  qus_paper_name: string;
  sub_name: string;
  summary: McqResultSummary;
  questions: McqResultQuestion[];
}

export interface McqApiResponse<T> {
  status: boolean;
  message: string;
  code?: string;
  data: T;
}
