import {useQuery} from '@tanstack/react-query';
import {QUERY_KEYS} from '../../../core/constants';
import {useAuth} from '../../../core/auth';
import {starsApi} from '../services/starsApi';
import {StarPeriod} from '../types/stars.types';

const useAdno = (studentId: string | null | undefined) => {
  const {students} = useAuth();
  const student = students.find(s => s.id === studentId);
  return {adno: student?.studentId || '', name: student?.name || ''};
};

/** One child's stars: totals, this week's rank, recent stars. */
export const useStarSummary = (studentId: string | null | undefined, enabled = true) => {
  const {adno, name} = useAdno(studentId);
  const query = useQuery({
    queryKey: [QUERY_KEYS.STARS_SUMMARY, adno],
    queryFn: () => starsApi.summary(adno),
    enabled: enabled && !!adno,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return {adno, studentName: name, summary: query.data, isLoading: query.isLoading, error: query.error, refetch: query.refetch};
};

/** The child's leaderboard for a period (scope is set by the school). */
export const useStarLeaderboard = (studentId: string | null | undefined, period: StarPeriod, enabled = true) => {
  const {adno} = useAdno(studentId);
  const query = useQuery({
    queryKey: [QUERY_KEYS.STARS_LEADERBOARD, adno, period],
    queryFn: () => starsApi.leaderboard(adno, period),
    enabled: enabled && !!adno,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return {board: query.data, isLoading: query.isLoading, error: query.error, refetch: query.refetch};
};
