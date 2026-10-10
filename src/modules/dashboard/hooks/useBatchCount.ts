import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { dashboardApi } from '../services/dashboardApi';
import { DashboardSummary } from '../types/dashboard.types';

/** Homework / attendance counts for one child, keyed by student id. */
export interface StudentDashboardCounts {
  homeworkCount: number;
  homeworkCompleted: number;
  attendancePercentage: number;
  leaveCount: number;
}

interface UseBatchCountResult {
  summary: DashboardSummary;
  byStudent: Record<string, StudentDashboardCounts>;
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
});

export const useBatchCount = (studentId?: string): UseBatchCountResult => {
  const { students, selectedStudentId } = useAuth();

  const targetStudentId = studentId || selectedStudentId;

  // Admission number (ADNO) of the selected student, and of every child: the
  // dashboard shows homework / attendance for all children at once, so ask
  // for all of them in one request instead of only the selected one.
  const student = students.find((s) => s.id === targetStudentId);
  const adno = student?.studentId || student?.id;
  const allAdnos = students.map((s) => String(s.studentId || s.id)).filter(Boolean);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD, 'batchCount', targetStudentId, allAdnos.join(',')],
    queryFn: async (): Promise<{ summary: DashboardSummary; byStudent: Record<string, StudentDashboardCounts> }> => {
      const empty = { summary: getDefaultSummary(), byStudent: {} };
      if (!adno) return empty;

      const response = await dashboardApi.getBatchCount(allAdnos.length ? allAdnos : [adno]);

      if (response.status && response.data) {
        const counts = response.data;
        const byStudent: Record<string, StudentDashboardCounts> = {};
        students.forEach((s) => {
          const sAdno = String(s.studentId || s.id);
          const hw = counts.homework?.find((h) => String(h.adno) === sAdno);
          const att = counts.attendance?.find((a) => String(a.adno) === sAdno);
          byStudent[s.id] = {
            homeworkCount: Number(hw?.count) || 0,
            homeworkCompleted: Number(hw?.completed) || 0,
            attendancePercentage: parseFloat(att?.percentage ?? '') || 0,
            leaveCount: parseFloat(att?.absent_days ?? '') || 0,
          };
        });

        const summary = getDefaultSummary();

        // Circulars count
        summary.circularsCount = response.data.circulars?.count || 0;

        // Homework count for the selected student
        const own = student ? byStudent[student.id] : undefined;
        summary.homeworkCount = own?.homeworkCount || 0;
        summary.homeworkCompleted = own?.homeworkCompleted || 0;

        // Attendance data for the selected student
        const attendanceItem = response.data.attendance?.find((a) => String(a.adno) === String(adno));
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

        return { summary, byStudent };
      }

      return empty;
    },
    enabled: !!adno,
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data changes frequently
    retry: 1, // Limit retries to avoid blocking the dashboard on persistent errors
  });

  return {
    summary: data?.summary || getDefaultSummary(),
    byStudent: data?.byStudent || {},
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
};
