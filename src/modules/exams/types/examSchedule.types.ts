export interface ExamScheduleRequest {
  CLASS_ID: number;
}

export interface ExamScheduleItem {
  subject: string;
  time: string;
  portion: string | null;
  exam_date: string; // Format: '15-Feb-2024'
  imgfile: string | null;
}

export interface ExamScheduleResponse {
  status: boolean;
  message: string;
  data: ExamScheduleItem[];
}
