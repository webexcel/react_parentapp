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
  const exams: Exam[] = (query.data?.examdata || []).map(item => ({
    id: item.exam_id,
    name: item.exam_name,
    year_id: item.Year_Id,
  }));

  return {
    exams,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
