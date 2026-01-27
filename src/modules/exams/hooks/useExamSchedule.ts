import { useQuery } from '@tanstack/react-query';
import { examScheduleApi } from '../services/examScheduleApi';
import { ExamScheduleItem } from '../types/examSchedule.types';

const QUERY_KEYS = {
  EXAM_SCHEDULE: 'examSchedule',
};

export const useExamSchedule = (classId?: string | number) => {
  console.log('=== useExamSchedule CALLED ===');
  console.log('classId received:', classId, 'type:', typeof classId);

  const query = useQuery({
    queryKey: [QUERY_KEYS.EXAM_SCHEDULE, classId],
    queryFn: async () => {
      console.log('=== FETCHING EXAM SCHEDULE ===');
      console.log('classId:', classId);

      if (!classId) {
        console.log('No classId - returning empty data');
        return { status: false, message: 'No class ID', data: [] };
      }

      const parsedClassId = typeof classId === 'string' ? parseInt(classId, 10) : classId;
      console.log('Parsed classId:', parsedClassId);

      const response = await examScheduleApi.getExamSchedule({
        CLASS_ID: parsedClassId,
      });
      console.log('Exam Schedule response:', response);
      return response;
    },
    enabled: !!classId && classId !== '',
  });

  const examSchedule: ExamScheduleItem[] = query.data?.data || [];

  // Don't expose error if we got a valid response (even if empty)
  // This handles the case where backend returns 400 for "no data"
  const hasValidResponse = query.data !== undefined;

  return {
    examSchedule,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: hasValidResponse ? null : query.error,
    refetch: query.refetch,
  };
};
