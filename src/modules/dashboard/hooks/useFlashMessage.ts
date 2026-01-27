import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { dashboardApi } from '../services/dashboardApi';
import { FlashMessage } from '../types/dashboard.types';

interface UseFlashMessageResult {
  flashMessages: FlashMessage[];
  hasFlashMessage: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

export const useFlashMessage = (): UseFlashMessageResult => {
  const {
    data: flashMessages = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.FLASH_MESSAGE],
    queryFn: async (): Promise<FlashMessage[]> => {
      const response = await dashboardApi.getFlashMessage();

      if (response.status && response.data) {
        return response.data;
      }

      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  return {
    flashMessages,
    hasFlashMessage: flashMessages.length > 0,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
};
