import {useQuery} from '@tanstack/react-query';
import {QUERY_KEYS} from '../../../core/constants';
import {useAuth} from '../../../core/auth';
import {mcqApi} from '../services/mcqApi';
import {McqTest} from '../types/mcq.types';

/** MCQ tests of one child. Fetched on demand only (screen focus / pull-to-refresh). */
export const useMcqTests = (studentId: string | null | undefined) => {
  const {students} = useAuth();
  const student = students.find(s => s.id === studentId);
  const adno = student?.studentId || '';

  const query = useQuery({
    queryKey: [QUERY_KEYS.MCQ_TESTS, adno],
    queryFn: (): Promise<McqTest[]> => mcqApi.list(adno),
    enabled: !!adno,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  return {
    adno,
    studentName: student?.name || '',
    tests: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
