export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'holiday'
  | 'leave'
  | 'half_day'
  | 'weekend'
  | 'future';

export interface DayAttendance {
  date: string;
  status: AttendanceStatus;
  name?: string; // For holidays
  session?: 'morning' | 'afternoon'; // For half days
}

export interface AttendanceSummary {
  totalDays: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  holidays: number;
  leaves: number;
  halfDays: number;
  weekends: number;
  percentage: number;
}

export interface AttendanceData {
  month: number;
  year: number;
  studentName: string;
  className: string;
  days: DayAttendance[];
  summary: AttendanceSummary;
}

export interface AttendanceResponse {
  status: boolean;
  message: string;
  data?: AttendanceData;
}
