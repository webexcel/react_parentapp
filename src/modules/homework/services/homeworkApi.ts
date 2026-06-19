import { apiClient, API_ENDPOINTS } from '../../../core/api';
import { HomeworkResponse } from '../types/homework.types';

export const homeworkApi = {
  /**
   * Get homework by class with pagination
   */
  getHomework: async (
    adno: string,
    classId: string,
    pageSize: number = 50,
    currentSize: number = 0,
  ): Promise<HomeworkResponse> => {
    const response = await apiClient.post<HomeworkResponse>(
      API_ENDPOINTS.HOMEWORK.GET_BY_CLASS,
      {
        adno,
        classid: classId,
        page_size: pageSize,
        current_size: currentSize,
      },
    );
    return response.data;
  },

  /**
   * Mark homework as complete
   */
  acknowledgeHomework: async (homeworkId: string, adno: string): Promise<boolean> => {
    const response = await apiClient.post(API_ENDPOINTS.HOMEWORK.MARK_COMPLETE, {
      homeworkId,
      adno,
    });

    if (!response.data?.status) {
      throw new Error(response.data?.message || 'Failed to mark homework as complete');
    }

    return true;
  },
};
