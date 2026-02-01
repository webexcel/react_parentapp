import { useQuery } from '@tanstack/react-query';
import { marksApi } from '../services/marksApi';

const QUERY_KEYS = {
  REPORT_CARD: 'reportCard',
};

export const useReportCard = (
  adno: string,
  classId: number,
  examGroupId: number | undefined,
  yearId: number,
  termType: string | undefined | null
) => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.REPORT_CARD, adno, classId, examGroupId, yearId, termType],
    queryFn: async () => {
      if (!examGroupId || !termType) {
        return { status: false, message: 'Missing parameters', data: '' };
      }
      const response = await marksApi.getTermReportcard({
        ADNO: adno,
        CLASSID: classId,
        EXGRPID: examGroupId,
        YEARID: yearId,
        TERMTYPE: termType,
      });
      return response;
    },
    enabled: !!adno && !!classId && !!examGroupId && !!yearId && !!termType,
  });

  return {
    reportCardUrl: query.data?.status ? query.data.data : null,
    isAvailable: query.data?.status === true && !!query.data?.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};
