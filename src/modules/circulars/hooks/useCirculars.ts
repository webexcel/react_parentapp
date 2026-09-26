import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { circularsApi } from '../services/circularsApi';
import { Circular } from '../types/circular.types';
import { parseAttachments } from '../../../core/utils/attachments';

export const useCirculars = () => {
  const { userData } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: circulars = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.CIRCULARS, userData?.mobileNumber],
    queryFn: async (): Promise<Circular[]> => {
      if (!userData?.mobileNumber) {
        return [];
      }

      const response = await circularsApi.getCirculars(userData.mobileNumber);

      if (response.status && response.data) {
        return response.data.map((item: any, index: number) => ({
          id: `${item.ADNO || 'circular'}-${index}`,
          sn: item.sn,
          title: item.STUDENTNAME || 'Circular',
          content: item.Message || '',
          date: item.SMSdate || '',
          category: 'General',
          attachments: parseAttachments(item.event_image, index),
          isRead: true,
          isAcknowledged: item.completed_status === '1',
          priority: 'normal',
          adno: item.ADNO || '',
        }));
      }
      return [];
    },
    enabled: !!userData?.mobileNumber,
    staleTime: 2 * 60 * 1000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async ({ sn, adno }: { sn: number; adno: string }) => {
      return circularsApi.acknowledgeCircular(sn, adno);
    },
    onMutate: async ({ sn }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.CIRCULARS, userData?.mobileNumber] });

      // Snapshot previous value
      const previousCirculars = queryClient.getQueryData<Circular[]>([QUERY_KEYS.CIRCULARS, userData?.mobileNumber]);

      // Optimistically update
      queryClient.setQueryData<Circular[]>(
        [QUERY_KEYS.CIRCULARS, userData?.mobileNumber],
        (old) => old?.map((c) => (c.sn === sn ? { ...c, isAcknowledged: true } : c)) || []
      );

      return { previousCirculars };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousCirculars) {
        queryClient.setQueryData(
          [QUERY_KEYS.CIRCULARS, userData?.mobileNumber],
          context.previousCirculars
        );
      }
      Alert.alert('Error', 'Failed to acknowledge circular. Please try again.');
    },
    onSettled: () => {
      // Silently refetch in background without showing loading state
      queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.CIRCULARS, userData?.mobileNumber],
      });
    },
  });

  const acknowledgeCircular = (sn: number, adno: string) => {
    acknowledgeMutation.mutate({ sn, adno });
  };

  return {
    circulars,
    isLoading,
    isFetching,
    error,
    refetch,
    acknowledgeCircular,
    isAcknowledging: acknowledgeMutation.isPending,
  };
};

