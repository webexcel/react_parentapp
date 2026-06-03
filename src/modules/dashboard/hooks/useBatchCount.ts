import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { dashboardApi } from '../services/dashboardApi';
import { DashboardSummary } from '../types/dashboard.types';

interface UseBatchCountResult {
  summary: DashboardSummary;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

const getDefaultSummary = (): DashboardSummary => ({
  circularsCount: 0,
  attendancePercentage: 0,
  todayAttendanceStatus: 'No Data',
  homeworkCount: 0,
  homeworkCompleted: 0,
  paymentDue: 0,
  paymentStatus: 'No Due',
  leaveCount: 0,
  homeworkByStudent: [],
  attendanceByStudent: [],
});

export const useBatchCount = (studentId?: string): UseBatchCountResult => {
  const { students, selectedStudentId } = useAuth();

  const targetStudentId = studentId || selectedStudentId;

  // Find the selected student's admission number (ADNO)
  const student = students.find((s) => s.id === targetStudentId);
  const adno = student?.studentId || student?.id;

  // Collect ALL siblings' admission numbers for the payload
  const allAdnos = students.map((s) => s.studentId || s.id);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD, 'batchCount', targetStudentId],
    queryFn: async (): Promise<DashboardSummary> => {
      if (!adno || allAdnos.length === 0) return getDefaultSummary();

      const response = await dashboardApi.getBatchCount(allAdnos);

      if (response.status && response.data) {
        const summary = getDefaultSummary();

        // Circulars count
        summary.circularsCount = response.data.circulars?.count || 0;

        // Store full per-student arrays
        summary.homeworkByStudent = response.data.homework || [];
        summary.attendanceByStudent = response.data.attendance || [];

        // Homework count for selected student
        const homeworkItem = response.data.homework?.find((h) => h.adno === adno);
        summary.homeworkCount = homeworkItem?.count || 0;
        summary.homeworkCompleted = homeworkItem?.completed || 0;

        // Attendance data for selected student
        const attendanceItem = response.data.attendance?.find((a) => a.adno === adno);
        if (attendanceItem) {
          summary.attendancePercentage = parseFloat(attendanceItem.percentage) || 0;
          summary.todayAttendanceStatus = attendanceItem.today_status || 'Not Marked';
          summary.leaveCount = parseFloat(attendanceItem.absent_days) || 0;
        }

        // Fees data
        if (response.data.fees) {
          summary.paymentDue = response.data.fees.balance_amount || 0;
          summary.paymentStatus = response.data.fees.payment_status || 'No Due';
        }

        return summary;
      }

      return getDefaultSummary();
    },
    enabled: !!adno,
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data changes frequently
    retry: 1, // Limit retries to avoid blocking the dashboard on persistent errors
  });

  return {
    summary: data || getDefaultSummary(),
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
};
