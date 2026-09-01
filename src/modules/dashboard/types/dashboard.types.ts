import { ApiResponse } from '../../../core/api/apiTypes';
import type { Attachment } from '../../../core/utils/attachments';

// ============================================
// Batch Count Types (POST /dashboard/batchCount)
// ============================================

export interface StudentBatchItem {
  adno: string;
  class_id?: string;
}

export interface BatchCountRequest {
  ADNO?: string[];  // Legacy support
  students?: StudentBatchItem[];  // New format with class_id
}

export interface AttendanceItem {
  adno: string;
  percentage: string;
  total_days: number;
  present_days: string;
  absent_days: string;
  today_status: string;
}

export interface HomeworkItem {
  adno: string;
  count: number;
  completed?: number;
}

export interface FeesData {
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: string;
}

export interface CircularsData {
  count: number;
}

export interface BatchCountData {
  circulars: CircularsData;
  homework: HomeworkItem[];
  attendance: AttendanceItem[];
  fees: FeesData;
}

export interface BatchCountResponse extends ApiResponse<BatchCountData> {}

// ============================================
// Flash Message Types (GET /dashboard/getFlashMessage)
// ============================================

export interface FlashMessage {
  /** Primary key. The column is `nid`; `id` is kept for older payloads. */
  nid: number;
  id?: number;
  message: string;
  start_date: string;
  NewsADate: string;
  show_flag: string;
  Title?: string;
  title?: string;
  type?: string;
  Discription?: string;
  description?: string;
  image?: string;
  /** Raw column: a JSON array string (multi-attach) or a bare URL (legacy). */
  event_image?: string;
  /** Parsed from `event_image` by useFlashMessage. */
  attachments?: Attachment[];
}

export interface FlashMessageResponse extends ApiResponse<FlashMessage[]> {}

// ============================================
// Latest Message Types (POST /dashboard/getLatestMessage)
// ============================================

export interface LatestMessage {
  sn: number;
  Message: string;
  SMSdate: string;
  broadcastTime: string;
  type: string;
  status: string;
  event_image?: string;
  ADNO?: string;
  mobile_number?: string;
}

export interface LatestMessageRequest {
  mobile_number: string;
}

export interface LatestMessageResponse extends ApiResponse<LatestMessage[]> {}

// ============================================
// Fee Balance Types (POST /dashboard/checkFeesBalance)
// ============================================

export interface FeeBalance {
  Admission_Id: string;
  Balance_Amount: number;
}

export interface FeeBalanceRequest {
  adno: string[];
}

export interface FeeBalanceResponse extends ApiResponse<FeeBalance[]> {}

// ============================================
// ID Card Types (POST /dashboard/getIdCard)
// ============================================

export interface IdCardInfo {
  NAME: string;
  fname: string;
  ADMISSION_ID: string;
  contact: string;
  contact1: string;
  dob: string;
  bg: string;
  address: string;
}

export interface IdCardRequest {
  adno: string;
}

export interface IdCardResponse extends ApiResponse<IdCardInfo[]> {}

// ============================================
// Fees Flash Types (POST /dashboard/feesFlash)
// ============================================

export interface FeesFlashRequest {
  adno: string;
}

export interface FeesFlashResponse {
  status: boolean;
  message: string;
}

// ============================================
// Dashboard Summary (computed from batchCount)
// ============================================

export interface DashboardSummary {
  circularsCount: number;
  attendancePercentage: number;
  todayAttendanceStatus: string;
  homeworkCount: number;
  homeworkCompleted: number;
  paymentDue: number;
  paymentStatus: string;
  leaveCount: number;
}

export interface StudentDashboardData {
  studentId: string;
  studentName: string;
  summary: DashboardSummary;
}
