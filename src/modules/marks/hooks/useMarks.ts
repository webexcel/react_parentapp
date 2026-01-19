import { useQuery } from '@tanstack/react-query';
import { marksApi } from '../services/marksApi';
import { useAuth } from '../../../core/auth';

const QUERY_KEYS = {
  MARKS: 'marks',
};

export const useMarks = (examId: number, yearId: number) => {
  const { students, selectedStudentId } = useAuth();
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const query = useQuery({
    queryKey: [QUERY_KEYS.MARKS, selectedStudent?.studentId, examId, yearId],
    queryFn: async () => {
      if (!selectedStudent?.studentId) {
        throw new Error('No student selected');
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
    enabled: !!selectedStudent?.studentId && examId > 0 && yearId > 0,
  });

  const marks = query.data?.data?.marks || [];
  const totalMarks = marks.reduce((acc, m) => acc + m.marks, 0);
  const totalPossible = marks.reduce((acc, m) => acc + m.total, 0);
  const percentage = totalPossible > 0 ? Math.round((totalMarks / totalPossible) * 100) : 0;

  return {
    marks,
    totalMarks,
    totalPossible,
    percentage,
    examName: query.data?.data?.exam_name || '',
    studentName: query.data?.data?.student_name || '',
    className: query.data?.data?.class || '',
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
