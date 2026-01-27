import { useQuery } from '@tanstack/react-query';
import { marksApi } from '../services/marksApi';
import { Exam } from '../types/marks.types';

const QUERY_KEYS = {
  EXAMS: 'exams',
};

export const useExams = (classId?: string | number) => {
  console.log('=== useExams CALLED ===');
  console.log('classId received:', classId, 'type:', typeof classId);

  const query = useQuery({
    queryKey: [QUERY_KEYS.EXAMS, classId],
    queryFn: async () => {
      console.log('=== FETCHING EXAMS FOR CLASS ===');
      console.log('classId:', classId);

      if (!classId) {
        console.log('No classId - returning empty examdata');
        return { status: false, message: 'No class ID', examdata: [] };
      }

      const parsedClassId = typeof classId === 'string' ? parseInt(classId, 10) : classId;
      console.log('Parsed classId:', parsedClassId);

      const response = await marksApi.selectExamName({
        class_Id: parsedClassId,
      });
      console.log('Exams response:', response);
      return response;
    },
    enabled: !!classId && classId !== '',
  });

  // Transform examdata to match the Exam interface used by MarksScreen
  // Filter out exams without valid year_id to prevent API errors
  const exams: Exam[] = (query.data?.examdata || [])
    .filter(item => item.exam_id && item.Year_Id)
    .map(item => ({
      id: item.exam_id,
      name: item.exam_name,
      year_id: item.Year_Id,
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
