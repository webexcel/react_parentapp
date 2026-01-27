import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { galleryApi } from '../services/galleryApi';
import { GalleryAlbum, GalleryImage } from '../types/gallery.types';

export const useGallery = () => {
  const { students, selectedStudentId } = useAuth();

  // Get the selected student's class ID
  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const classId = selectedStudent?.classId;
  const classIds = classId ? [classId] : [];

  console.log('=== useGallery ===');
  console.log('selectedStudent:', JSON.stringify(selectedStudent));
  console.log('classId:', classId);

  const {
    data: albums = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.GALLERY, classIds],
    queryFn: async (): Promise<GalleryAlbum[]> => {
      console.log('=== GALLERY FETCH ===');
      console.log('classIds:', classIds);

      if (classIds.length === 0) {
        console.log('No classIds available - student may not have CLASS_ID');
        return [];
      }

      try {
        const response = await galleryApi.getCategories(classIds);
        console.log('Gallery response:', JSON.stringify(response));

        if (response.status && response.data) {
          const baseUrl = response.url || '';

          return response.data.map((category) => {
            // Build image URLs from the image names
            const images: GalleryImage[] = category.images.map((imageName, index) => ({
              id: `${category.CatID}-${index}`,
              uri: `${baseUrl}/${category.CatID}/${imageName}`,
              thumbnailUri: `${baseUrl}/${category.CatID}/thumb_${imageName}`,
            }));

            // Use first image as cover
            const coverImage = images.length > 0 ? images[0].thumbnailUri || images[0].uri : '';

            return {
              id: String(category.CatID),
              title: category.CatName,
              description: category.Description,
              date: category.SMSdate,
              coverImage,
              imageCount: images.length,
              images,
            };
          });
        }
        return [];
      } catch (err) {
        // Return empty array on error - galleryApi already handles 400
        console.log('Gallery fetch error handled:', err);
        return [];
      }
    },
    enabled: classIds.length > 0,
  });

  // Don't expose error if query completed (even with empty data)
  // This handles the case where backend returns 400 for "no data"
  const hasCompletedQuery = !isLoading && !isFetching;

  return {
    albums,
    isLoading: isLoading || isFetching,
    isFetching,
    error: hasCompletedQuery && albums.length === 0 ? null : error,
    refetch,
  };
};
