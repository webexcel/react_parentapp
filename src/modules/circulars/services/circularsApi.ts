import { apiClient, API_ENDPOINTS } from '../../../core/api';
import { CircularsResponse } from '../types/circular.types';

export const circularsApi = {
  /**
   * Get all circulars for parent
   */
  getCirculars: async (
    mobileNumber: string,
    pageSize: number = 50,
    currentSize: number = 0
  ): Promise<CircularsResponse> => {
    const response = await apiClient.post<CircularsResponse>(
      API_ENDPOINTS.CIRCULAR.GET_ALL,
      {
        mobile_number: mobileNumber,
        page_size: pageSize,
        current_size: currentSize,
      }
    );
    return response.data;
  },

  /**
   * Get file content as base64
   */
  getBase64: async (fileUrl: string): Promise<string | null> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.CIRCULAR.GET_BASE64, {
        fileUrl,
      });
      return response.data?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get student photo by admission number
   */
  getStudentPhoto: async (adno: string): Promise<string | null> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.GET_STUDENT_PHOTO, {
        adno,
      });
      const photoData = response.data?.data;

      if (photoData && typeof photoData === 'string' && photoData.length > 0) {
        // Check if it's already a data URI
        if (photoData.startsWith('data:image/')) {
          const base64Part = photoData.split(',')[1];

          // Check if base64 contains HTML error page markers
          // "PCFET0NUWVBFIGh0bWw" = "<!DOCTYPE html" in base64
          if (base64Part?.startsWith('PCFET0NUWVBFIGh0bWw') ||
              base64Part?.startsWith('PGh0bWw') || // "<html"
              base64Part?.startsWith('PCFET0')) { // "<!DO"
            return null; // HTML error page, not an image
          }

          return photoData; // Valid image data
        }

        // If it's raw base64, add the data URI prefix
        // Assume JPEG format by default (most common)
        return `data:image/jpeg;base64,${photoData}`;
      }
      return null;
    } catch {
      return null;
    }
  },
};
