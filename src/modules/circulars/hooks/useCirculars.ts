import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {  } from 'react-native';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { useOptionalMenuAccess } from '../../../core/menu';
import { circularsApi } from '../services/circularsApi';
import { Circular } from '../types/circular.types';
import { parseAttachments } from '../../../core/utils/attachments';
import { AppAlert } from '../../../design-system/molecules/AppAlert';

export const useCirculars = () => {
  const { userData, students } = useAuth();
  const queryClient = useQueryClient();

  // Only children who have the Circulars menu: the server counts, pages and
  // marks-as-seen for these alone. Before the children are known (none loaded)
  // nothing is sent, which keeps the old fetch-everything behaviour.
  const menu = useOptionalMenuAccess();
  const permitted = menu ? menu.studentsWithMenu('circulars') : students;
  const adnos =
    students.length > 0 ? permitted.map((s) => String(s.studentId || s.id)).filter(Boolean) : undefined;
  // The key carries the permitted set so the list refetches when it changes.
  const queryKey = [QUERY_KEYS.CIRCULARS, userData?.mobileNumber, adnos ? adnos.join(',') : 'all'];

  const {
    data: circulars = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKey,
    queryFn: async (): Promise<Circular[]> => {
      if (!userData?.mobileNumber) {
        return [];
      }

      // Children known but none has the menu: nothing to fetch.
      if (adnos && adnos.length === 0) {
        return [];
      }

      const response = await circularsApi.getCirculars(userData.mobileNumber, 50, 0, adnos);

      if (response.status && response.data) {
        const allowed = adnos ? new Set(adnos) : null;
        return response.data
          // Safety net: the server already filters, never show another child's.
          .filter((item: any) => !allowed || allowed.has(String(item.ADNO)))
          .map((item: any, index: number) => ({
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
      await queryClient.cancelQueries({ queryKey: queryKey });

      // Snapshot previous value
      const previousCirculars = queryClient.getQueryData<Circular[]>(queryKey);

      // Optimistically update
      queryClient.setQueryData<Circular[]>(
        queryKey,
        (old) => old?.map((c) => (c.sn === sn ? { ...c, isAcknowledged: true } : c)) || []
      );

      return { previousCirculars };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousCirculars) {
        queryClient.setQueryData(
          queryKey,
          context.previousCirculars
        );
      }
      AppAlert.alert('Error', 'Failed to acknowledge circular. Please try again.');
    },
    onSettled: () => {
      // Silently refetch in background without showing loading state
      queryClient.refetchQueries({
        queryKey: queryKey,
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

