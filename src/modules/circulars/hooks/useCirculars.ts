import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { circularsApi } from '../services/circularsApi';
import { Attachment, Circular } from '../types/circular.types';

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

const parseAttachments = (eventImage: any, index: number): Attachment[] => {
  if (!eventImage || typeof eventImage !== 'string' || eventImage.trim() === '') {
    return [];
  }

  const trimmed = eventImage.trim();

  // Single URL starting with http
  if (trimmed.startsWith('http')) {
    return [{
      id: String(index),
      type: getAttachmentType(trimmed),
      url: trimmed,
      name: 'Attachment',
    }];
  }

  // Stringified JSON array — clean whitespace inside URLs before parsing
  if (trimmed.startsWith('[')) {
    try {
      const sanitized = trimmed.replace(/\s+/g, '');
      const parsed = JSON.parse(sanitized);
      if (Array.isArray(parsed)) {
        const urls = parsed.filter(
          (u: any) => typeof u === 'string' && u !== '',
        );
        if (urls.length > 0) {
          return urls.map((url: string, idx: number) => ({
            id: `${index}-${idx}`,
            type: getAttachmentType(url),
            url,
            name: `Attachment ${idx + 1}`,
          }));
        }
      }
    } catch {
      // Invalid JSON, fall through
    }
  }

  return [];
};

const getAttachmentType = (url: string): 'pdf' | 'image' | 'audio' | 'video' | 'document' => {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'aac', 'm4a'].includes(ext)) return 'audio';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
  return 'document';
};
