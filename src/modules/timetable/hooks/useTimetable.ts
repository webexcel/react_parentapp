import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { timetableApi } from '../services/timetableApi';
import { TimetableEntry } from '../types/timetable.types';

export interface DayTimetable {
  dayId: number;
  periods: TimetableEntry[];
}

export const useTimetable = () => {
  const { students, selectedStudentId } = useAuth();

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const classId = selectedStudent?.classId;

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.TIMETABLE, classId],
    queryFn: async () => {
      if (!classId) return [];

      const response = await timetableApi.getStudentTimetable(classId);

      if (response.status && response.data) {
        return response.data;
      }

      return [];
    },
    enabled: !!classId,
  });

  const timetableByDay = useMemo(() => {
    const entries = data || [];
    const grouped: Record<number, TimetableEntry[]> = {};

    entries.forEach((entry) => {
      if (!grouped[entry.day_id]) {
        grouped[entry.day_id] = [];
      }
      grouped[entry.day_id].push(entry);
    });

    // Sort periods within each day
    Object.values(grouped).forEach((periods) => {
      periods.sort((a, b) => a.period_id - b.period_id);
    });

    return grouped;
  }, [data]);

  return {
    timetableData: data || [],
    timetableByDay,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
};
