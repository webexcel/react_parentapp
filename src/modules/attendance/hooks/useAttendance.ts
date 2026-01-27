import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { attendanceApi } from '../services/attendanceApi';
import { DayAttendance, AttendanceSummary, AttendanceData } from '../types/attendance.types';

interface UseAttendanceResult {
  attendanceData: AttendanceData | null;
  days: DayAttendance[];
  summary: AttendanceSummary;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useAttendance = (month?: number, year?: number): UseAttendanceResult => {
  const { selectedStudentId, students } = useAuth();

  // Find the selected student to get their ADNO (studentId field)
  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const adno = selectedStudent?.studentId || selectedStudentId;

  const currentDate = new Date();
  const selectedMonth = month ?? currentDate.getMonth() + 1;
  const selectedYear = year ?? currentDate.getFullYear();

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE, selectedStudentId, selectedMonth, selectedYear],
    staleTime: 0,
    queryFn: async () => {
      if (!adno) {
        return null;
      }

      const response = await attendanceApi.getAttendance(
        adno,
        selectedMonth,
        selectedYear
      );

      if (response.status && response.data) {
        return response.data;
      }

      return null;
    },
    enabled: !!adno,
  });

  return {
    attendanceData: data || null,
    days: data?.days || [],
    summary: data?.summary || getDefaultSummary(),
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
};

const getDefaultSummary = (): AttendanceSummary => ({
  totalDays: 0,
  workingDays: 0,
  presentDays: 0,
  absentDays: 0,
  holidays: 0,
  leaves: 0,
  halfDays: 0,
  weekends: 0,
  percentage: 0,
});
