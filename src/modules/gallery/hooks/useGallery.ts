import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { useOptionalMenuAccess } from '../../../core/menu';
import { galleryApi } from '../services/galleryApi';
import { GalleryAlbum, GalleryImage } from '../types/gallery.types';

export const useGallery = () => {
  const { students } = useAuth();
  const menu = useOptionalMenuAccess();

  // Albums for the class of every child WHO HAS the Gallery menu, plus
  // school-wide ones (class_id 0 - what the web and teacher app save). Using
  // only the selected child hid albums of the other children; using all
  // children would show albums of a child whose Gallery menu is off.
  const galleryStudents = menu ? menu.studentsWithMenu('gallery') : students;
  const classIds = Array.from(
    new Set<string | number>([...galleryStudents.map((s) => s.classId).filter((c): c is string => !!c), 0])
  );
  // The server derives the classes from these (after checking them against the
  // login and the Gallery menu). Nothing is sent before the children are known.
  const adnos =
    students.length > 0 ? galleryStudents.map((s) => String(s.studentId || s.id)).filter(Boolean) : undefined;

  const {
    data: albums = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.GALLERY, classIds, adnos ? adnos.join(',') : 'all'],
    queryFn: async (): Promise<GalleryAlbum[]> => {
      // Children are known but none has the Gallery menu: nothing to fetch.
      if (classIds.length === 0 || (adnos && adnos.length === 0)) {
        return [];
      }

      try {
        const response = await galleryApi.getCategories(classIds, adnos);

        if (response.status && response.data) {
          const baseUrl = response.url || '';

          return response.data.map((category) => {
            // Build image URLs - use as-is if already absolute, otherwise prepend baseUrl
            const images: GalleryImage[] = category.images.map((imageName, index) => {
              const isAbsolute = imageName.startsWith('http');
              const uri = isAbsolute ? imageName : `${baseUrl}/${imageName}`;
              const isVideo = /\.(mp4|mov|avi|mkv|webm|3gp)$/i.test(imageName);
              return {
                id: `${category.CatID}-${index}`,
                uri,
                thumbnailUri: isVideo ? undefined : (isAbsolute ? imageName : `${baseUrl}/thumb_${imageName}`),
                type: isVideo ? 'video' as const : 'image' as const,
              };
            });

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
