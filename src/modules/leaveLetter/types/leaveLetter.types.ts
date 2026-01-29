// Leave Letter Types

export type SessionType = 0 | 1 | 2; // 0=Full Day, 1=Forenoon, 2=Afternoon
export type LeaveStatus = 'REQUEST' | 'APPROVED' | 'REJECTED';

// Session options for dropdown
export const SESSION_OPTIONS = [
  { value: '0', label: 'Full Day' },
  { value: '1', label: 'Forenoon' },
  { value: '2', label: 'Afternoon' },
] as const;

// Get session label by value
export const getSessionLabel = (value: number | string): string => {
  const option = SESSION_OPTIONS.find(opt => opt.value === String(value));
  return option?.label || 'Unknown';
};

// Get status color
export const getStatusColor = (status: LeaveStatus): string => {
  switch (status) {
    case 'APPROVED':
      return '#10b981'; // green
    case 'REJECTED':
      return '#ef4444'; // red
    case 'REQUEST':
    default:
      return '#f59e0b'; // yellow/amber
  }
};

// API Response types
export interface LeaveRequest {
  id: number;
  adno: string;
  class_id: number;
  abtype: SessionType;
  fdate: string; // Start date (YYYY-MM-DD)
  tdate: string; // End date (YYYY-MM-DD)
  reson: string; // Message/reason (note: API spells it "reson")
  class_staff_id: number | null;
  updateTme: string;
  leaveStatus: LeaveStatus;
  status: number;
}

// API Payloads
export interface GetLeaveRequestPayload {
  ADNO: string;
}

export interface InsertLeaveRequestPayload {
  ADNO: string;
  CLASS_ID: string;
  selectedSession: string; // "0", "1", or "2"
  s_date: string; // YYYY-MM-DD
  e_date: string; // YYYY-MM-DD
  message: string;
}

export interface UpdateLeaveRequestPayload {
  id: number;
  selectedSession: string;
  s_date: string;
  e_date: string;
  message: string;
}

export interface DeleteLeaveRequestPayload {
  id: number;
}

// API Response
export interface LeaveLetterResponse<T = LeaveRequest[]> {
  status?: boolean;
  message?: string;
  data?: T;
}

// Form state for creating/editing
export interface LeaveFormData {
  sessionType: string;
  startDate: Date;
  endDate: Date;
  message: string;
}

// For editing existing requests
export interface EditingLeaveRequest extends LeaveRequest {
  isEditing: true;
}
