// Leave Letter Types

export type SessionType = 0 | 1 | 2; // 0=Full Day, 1=Forenoon, 2=Afternoon
export type LeaveStatus = 'REQUEST' | 'APPROVED' | 'REJECTED' | 'PENDING';

// Session options for dropdown
export const SESSION_OPTIONS = [
  { value: '0', label: 'Full Day' },
  { value: '1', label: 'Forenoon' },
  { value: '2', label: 'Afternoon' },
] as const;

// Status display configuration with colors
export const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  REQUEST: {
    label: 'Pending',
    color: '#D97706', // amber-600
    bgColor: '#FEF3C7', // amber-100
  },
  PENDING: {
    label: 'Pending',
    color: '#D97706', // amber-600
    bgColor: '#FEF3C7', // amber-100
  },
  APPROVED: {
    label: 'Approved',
    color: '#059669', // emerald-600
    bgColor: '#D1FAE5', // emerald-100
  },
  REJECTED: {
    label: 'Rejected',
    color: '#DC2626', // red-600
    bgColor: '#FEE2E2', // red-100
  },
};

// Get session label by value
export const getSessionLabel = (value: number | string): string => {
  const option = SESSION_OPTIONS.find(opt => opt.value === String(value));
  return option?.label || 'Unknown';
};

// Get status color (text color)
export const getStatusColor = (status: string): string => {
  const config = STATUS_CONFIG[status?.toUpperCase()];
  return config?.color || '#6B7280'; // gray fallback
};

// Get status background color
export const getStatusBgColor = (status: string): string => {
  const config = STATUS_CONFIG[status?.toUpperCase()];
  return config?.bgColor || '#F3F4F6'; // gray fallback
};

// Get status display label
export const getStatusLabel = (status: string): string => {
  const config = STATUS_CONFIG[status?.toUpperCase()];
  return config?.label || status || 'Unknown';
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
