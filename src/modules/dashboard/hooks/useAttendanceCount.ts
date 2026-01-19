import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { attendanceApi } from '../../attendance/services/attendanceApi';

interface UseAttendanceCountResult {
  leaveCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

export const useAttendanceCount = (studentId?: string): UseAttendanceCountResult => {
  const { students, selectedStudentId } = useAuth();

  const targetStudentId = studentId || selectedStudentId;

  // Find the student's admission number (ADNO)
  const student = students.find((s) => s.id === targetStudentId);
  const adno = student?.studentId || student?.id;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD, 'attendanceCount', targetStudentId],
    queryFn: async (): Promise<number> => {
      if (!adno) return 0;

      try {
        const response = await attendanceApi.getAttendance(adno);

        if (response.status && response.data) {
          // The API returns an array of absent dates
          // Count the length of the array to get total leaves
          return Array.isArray(response.data) ? response.data.length : 0;
        }

        return 0;
      } catch (err) {
        console.error('Error fetching attendance count:', err);
        return 0;
      }
    },
    enabled: !!adno,
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data changes frequently
  });

  return {
    leaveCount: data || 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
