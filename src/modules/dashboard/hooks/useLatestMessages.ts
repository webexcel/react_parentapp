import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { dashboardApi } from '../services/dashboardApi';
import { LatestMessage } from '../types/dashboard.types';

interface UseLatestMessagesResult {
  latestMessages: LatestMessage[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

export const useLatestMessages = (): UseLatestMessagesResult => {
  const { userData } = useAuth();
  const mobileNumber = userData?.user_name;

  const {
    data: latestMessages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.LATEST_MESSAGE, mobileNumber],
    queryFn: async (): Promise<LatestMessage[]> => {
      if (!mobileNumber) return [];

      const response = await dashboardApi.getLatestMessage(mobileNumber);

      if (response.status && response.data) {
        return response.data;
      }

      return [];
    },
    enabled: !!mobileNumber,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    latestMessages,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
