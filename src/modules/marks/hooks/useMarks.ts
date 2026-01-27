import { useQuery } from '@tanstack/react-query';
import { marksApi } from '../services/marksApi';
import { useAuth } from '../../../core/auth';

const QUERY_KEYS = {
  MARKS: 'marks',
};

export const useMarks = (examId: number, yearId: number) => {
  const { students, selectedStudentId } = useAuth();
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Validate that we have all required parameters
  const hasValidParams = !!selectedStudent?.studentId && examId > 0 && yearId > 0;

  const query = useQuery({
    queryKey: [QUERY_KEYS.MARKS, selectedStudent?.studentId, examId, yearId],
    queryFn: async () => {
      // Double-check params before making API call
      if (!selectedStudent?.studentId || !examId || !yearId) {
        console.log('=== MARKS SKIPPED - Missing params ===');
        console.log('studentId:', selectedStudent?.studentId);
        console.log('examId:', examId);
        console.log('yearId:', yearId);
        return {
          status: false,
          message: 'Missing required parameters',
          data: { marks: [], exam_name: '', student_name: '', class: '' },
        };
      }

      console.log('=== FETCHING MARKS ===');
      console.log('ADNO:', selectedStudent.studentId);
      console.log('examId:', examId);
      console.log('yearId:', yearId);

      const response = await marksApi.getMarksByAdno({
        ADNO: selectedStudent.studentId,
        examid: examId,
        yearid: yearId,
      });

      console.log('=== MARKS RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Data:', response.data);

      return response;
    },
    enabled: hasValidParams,
  });

  const marks = query.data?.data?.marks || [];
  const totalMarks = marks.reduce((acc, m) => acc + m.marks, 0);
  const totalPossible = marks.reduce((acc, m) => acc + m.total, 0);
  const percentage = totalPossible > 0 ? Math.round((totalMarks / totalPossible) * 100) : 0;

  // Don't expose error if we got a valid response (even if empty)
  // This handles the case where backend returns 400 for "no data"
  const hasValidResponse = query.data !== undefined;

  return {
    marks,
    totalMarks,
    totalPossible,
    percentage,
    examName: query.data?.data?.exam_name || '',
    studentName: query.data?.data?.student_name || '',
    className: query.data?.data?.class || '',
    isLoading: query.isLoading || query.isFetching,
    isFetching: query.isFetching,
    hasValidParams,
    error: hasValidResponse ? null : query.error,
    refetch: query.refetch,
  };
};
