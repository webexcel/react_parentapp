export interface ReportCardType {
  /** 0 = the exam group's default template */
  id: number;
  report_type: string;
  Year_Id: number;
  status: number;
  /** Set when the card can't be shown yet; the app explains instead of generating it. */
  locked?: boolean;
  lock_reason?: 'fees' | 'unpublished';
  lock_message?: string;
  pending_amount?: number;
}

export interface ReportCardTypesResponse {
  status: boolean;
  message: string;
  data: ReportCardType[];
}

export interface GenerateReportCardRequest {
  admissionId: string;
  yearid: number;
  report_type_id: number;
}
