import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { circularsApi } from '../services/circularsApi';
import { Circular } from '../types/circular.types';

export const useCirculars = () => {
  const { userData } = useAuth();

  const {
    data: circulars = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.CIRCULARS, userData?.mobileNumber],
    queryFn: async (): Promise<Circular[]> => {
      console.log('=== CIRCULARS FETCH ===');
      console.log('userData:', JSON.stringify(userData));
      if (!userData?.mobileNumber) {
        console.log('No mobileNumber, returning empty');
        return [];
      }

      console.log('Fetching circulars for:', userData.mobileNumber);
      const response = await circularsApi.getCirculars(userData.mobileNumber);
      console.log('Circulars response:', JSON.stringify(response));

      if (response.status && response.data) {
        return response.data.map((item: any, index: number) => ({
          id: `${item.ADNO || 'circular'}-${index}`,
          title: item.STUDENTNAME || 'Circular',
          content: item.Message || '',
          date: item.SMSdate || '',
          category: 'General',
          attachments: item.event_image
            ? [
                {
                  id: String(index),
                  type: getAttachmentType(item.event_image),
                  url: item.event_image,
                  name: 'Attachment',
                },
              ]
            : [],
          isRead: true,
          priority: 'normal',
          adno: item.ADNO || '',
        }));
      }
      return [];
    },
    enabled: !!userData?.mobileNumber,
  });

  return {
    circulars,
    isLoading,
    error,
    refetch,
  };
};

const getAttachmentType = (url: string): 'pdf' | 'image' | 'audio' | 'document' => {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'aac', 'm4a'].includes(ext)) return 'audio';
  return 'document';
};
