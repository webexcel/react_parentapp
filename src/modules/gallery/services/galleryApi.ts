import { apiClient, API_ENDPOINTS } from '../../../core/api';
import { GalleryCategoriesResponse, GalleryImagesResponse } from '../types/gallery.types';

export const galleryApi = {
  /**
   * Get gallery categories for parent based on class IDs
   */
  getCategories: async (classIds: string[]): Promise<GalleryCategoriesResponse> => {
    const response = await apiClient.post<GalleryCategoriesResponse>(
      API_ENDPOINTS.GALLERY.GET_CATEGORIES,
      {
        class_id: classIds,
      }
    );
    return response.data;
  },

  /**
   * Get all images for a specific category
   */
  getCategoryImages: async (categoryId: number): Promise<GalleryImagesResponse> => {
    const response = await apiClient.post<GalleryImagesResponse>(
      API_ENDPOINTS.GALLERY.GET_ALL_IMAGES,
      {
        GalCatID: categoryId,
      }
    );
    return response.data;
  },
};
