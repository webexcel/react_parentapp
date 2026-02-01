import { useQuery } from '@tanstack/react-query';
import { marksApi } from '../services/marksApi';
import { Exam } from '../types/marks.types';

const QUERY_KEYS = {
  EXAMS: 'exams',
};

export const useExams = (classId?: string | number) => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.EXAMS, classId],
    queryFn: async () => {
      if (!classId) {
        return { status: false, message: 'No class ID', examdata: [] };
      }

      const parsedClassId = typeof classId === 'string' ? parseInt(classId, 10) : classId;

      const response = await marksApi.selectExamName({
        class_Id: parsedClassId,
      });
      return response;
    },
    enabled: !!classId && classId !== '',
  });

  // Transform examdata to match the Exam interface used by MarksScreen
  // Filter out exams without valid year_id to prevent API errors
  // Order by exam_id ascending (handled by backend)
  const exams: Exam[] = (query.data?.examdata || [])
    .filter(item => item.exam_id && item.Year_Id)
    .map(item => ({
      id: item.exam_id,
      name: item.exam_name,
      year_id: item.Year_Id,
      term_type: item.term_type,
    }));

  // Don't expose error if we got a valid response (even if empty)
  // This handles the case where backend returns 400 for "no data"
  const hasValidResponse = query.data !== undefined;

  // Consider loading if query is loading OR if we're waiting for classId
  const isWaitingForClassId = !classId || classId === '';
  const isLoading = query.isLoading || query.isFetching;

  return {
    exams,
    isLoading,
    isWaitingForClassId,
    error: hasValidResponse ? null : query.error,
    refetch: query.refetch,
  };
};
