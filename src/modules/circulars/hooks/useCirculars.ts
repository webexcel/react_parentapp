import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { circularsApi } from '../services/circularsApi';
import { Attachment, Circular } from '../types/circular.types';

const PAGE_SIZE = 10;

export const useCirculars = () => {
  const { userData } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.CIRCULARS, userData?.mobileNumber],
    queryFn: async ({ pageParam = 0 }): Promise<{
      circulars: Circular[];
      totalSize: number;
      currentOffset: number;
    }> => {
      if (!userData?.mobileNumber) {
        return { circulars: [], totalSize: 0, currentOffset: 0 };
      }

      const response = await circularsApi.getCirculars(
        userData.mobileNumber,
        PAGE_SIZE,
        pageParam,
      );

      const totalSize = response.total_size || 0;

      if (response.status && response.data) {
        const circulars = response.data.map((item: any, index: number) => ({
          id: `${item.ADNO || 'circular'}-${pageParam + index}`,
          sn: item.sn,
          title: item.STUDENTNAME || 'Circular',
          content: item.Message || '',
          date: item.SMSdate || '',
          category: 'General',
          attachments: parseAttachments(item.event_image, pageParam + index),
          isRead: true,
          isAcknowledged: item.completed_status === '1',
          priority: 'normal',
          adno: item.ADNO || '',
        }));
        return { circulars, totalSize, currentOffset: pageParam };
      }
      return { circulars: [], totalSize, currentOffset: pageParam };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.currentOffset + PAGE_SIZE;
      return nextOffset < lastPage.totalSize ? nextOffset : undefined;
    },
    enabled: !!userData?.mobileNumber,
    staleTime: 0,
  });

  // Flatten all pages into a single array
  const circulars = data?.pages.flatMap((page) => page.circulars) || [];
  const totalSize = data?.pages[0]?.totalSize || 0;

  const acknowledgeMutation = useMutation({
    mutationFn: async ({ sn, adno }: { sn: number; adno: string }) => {
      return circularsApi.acknowledgeCircular(sn, adno);
    },
    onMutate: async ({ sn }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.CIRCULARS, userData?.mobileNumber] });

      const previousData = queryClient.getQueryData([QUERY_KEYS.CIRCULARS, userData?.mobileNumber]);

      queryClient.setQueryData(
        [QUERY_KEYS.CIRCULARS, userData?.mobileNumber],
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              circulars: page.circulars.map((c: Circular) =>
                c.sn === sn ? { ...c, isAcknowledged: true } : c
              ),
            })),
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [QUERY_KEYS.CIRCULARS, userData?.mobileNumber],
          context.previousData
        );
      }
      Alert.alert('Error', 'Failed to acknowledge circular. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CIRCULARS, userData?.mobileNumber],
      });
    },
  });

  const acknowledgeCircular = (sn: number, adno: string) => {
    acknowledgeMutation.mutate({ sn, adno });
  };

  return {
    circulars,
    totalSize,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    refetch,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
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
