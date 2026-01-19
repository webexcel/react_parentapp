import { useQuery } from '@tanstack/react-query';
import { examScheduleApi } from '../services/examScheduleApi';
import { ExamScheduleItem } from '../types/examSchedule.types';

const QUERY_KEYS = {
  EXAM_SCHEDULE: 'examSchedule',
};

export const useExamSchedule = (classId?: string | number) => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.EXAM_SCHEDULE, classId],
    queryFn: async () => {
      if (!classId) {
        return { status: false, message: 'No class ID', data: [] };
      }

      const parsedClassId = typeof classId === 'string' ? parseInt(classId, 10) : classId;

      const response = await examScheduleApi.getExamSchedule({
        CLASS_ID: parsedClassId,
      });
      return response;
    },
    enabled: !!classId && classId !== '',
  });

  const examSchedule: ExamScheduleItem[] = query.data?.data || [];

  return {
    examSchedule,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
