import { apiClient, API_ENDPOINTS } from '../../../core/api';
import { HomeworkResponse } from '../types/homework.types';

export const homeworkApi = {
  /**
   * Get homework by class
   */
  getHomework: async (adno: string, classId: string): Promise<HomeworkResponse> => {
    const response = await apiClient.post<HomeworkResponse>(
      API_ENDPOINTS.HOMEWORK.GET_BY_CLASS,
      { adno, classid: classId }
    );
    return response.data;
  },

  /**
   * Mark homework as complete
   */
  acknowledgeHomework: async (homeworkId: string, adno: string): Promise<boolean> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.HOMEWORK.MARK_COMPLETE, {
        homeworkId,
        adno,
      });
      return response.data?.status || false;
    } catch (error) {
      console.error('Error marking homework complete:', error);
      return false;
    }
  },
};
