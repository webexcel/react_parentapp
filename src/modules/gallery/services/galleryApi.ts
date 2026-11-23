import { apiClient, API_ENDPOINTS } from '../../../core/api';
import { GalleryCategoriesResponse, GalleryImagesResponse } from '../types/gallery.types';

export const galleryApi = {
  /**
   * Get gallery categories for parent based on class IDs
   */
  getCategories: async (
    classIds: Array<string | number>,
    adnos?: string[]
  ): Promise<GalleryCategoriesResponse> => {
    try {
      const response = await apiClient.post<GalleryCategoriesResponse>(
        API_ENDPOINTS.GALLERY.GET_CATEGORIES,
        {
          // Legacy input, still read by a backend that doesn't know `adnos`
          class_id: classIds,
          // Preferred: the children who have the Gallery menu. The server checks
          // them against the login and derives the classes itself.
          ...(adnos ? { adnos } : {}),
        }
      );
      return response.data;
    } catch (error: any) {
      // Backend returns 400 when no gallery data exists - treat as empty data
      if (error.response?.status === 400) {
        return {
          status: false,
          message: error.response?.data?.message || 'No Media available',
          data: [],
        };
      }
      throw error;
    }
  },

  /**
   * Get all images for a specific category
   */
  getCategoryImages: async (categoryId: number): Promise<GalleryImagesResponse> => {
    try {
      const response = await apiClient.post<GalleryImagesResponse>(
        API_ENDPOINTS.GALLERY.GET_ALL_IMAGES,
        {
          GalCatID: categoryId,
        }
      );
      return response.data;
    } catch (error: any) {
      // Backend returns 400 when no images exist - treat as empty data
      if (error.response?.status === 400) {
        return {
          status: false,
          message: error.response?.data?.message || 'No images available',
          data: [],
        };
      }
      throw error;
    }
  },
};
