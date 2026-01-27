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
    console.log('=== ACKNOWLEDGE HOMEWORK API CALL ===');
    console.log('homeworkId:', homeworkId);
    console.log('adno:', adno);

    const response = await apiClient.post(API_ENDPOINTS.HOMEWORK.MARK_COMPLETE, {
      homeworkId,
      adno,
    });

    console.log('=== ACKNOWLEDGE HOMEWORK API RESPONSE ===');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (!response.data?.status) {
      throw new Error(response.data?.message || 'Failed to mark homework as complete');
    }

    return true;
  },
};
