import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { circularsApi } from '../services/circularsApi';

export const useStudentPhoto = (adno: string | undefined) => {
  const {
    data: photoUrl,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.STUDENT_PHOTO, adno],
    queryFn: async (): Promise<string | null> => {
      if (!adno) {
        return null;
      }
      return await circularsApi.getStudentPhoto(adno);
    },
    enabled: !!adno,
    staleTime: 1000 * 60 * 60, // 1 hour - photos don't change often
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  return {
    photoUrl,
    isLoading,
    error,
  };
};
