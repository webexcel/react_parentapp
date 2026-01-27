import { apiClient } from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';
import {
  ExamScheduleRequest,
  ExamScheduleResponse,
} from '../types/examSchedule.types';

export const examScheduleApi = {
  getExamSchedule: async (params: ExamScheduleRequest): Promise<ExamScheduleResponse> => {
    console.log('=== examScheduleApi.getExamSchedule ===');
    console.log('Request params:', params);
    try {
      const response = await apiClient.post<ExamScheduleResponse>(
        API_ENDPOINTS.EXAM_SCHEDULE.GET,
        params
      );
      console.log('Success response:', response.data);
      return response.data;
    } catch (error: any) {
      console.log('=== examScheduleApi ERROR ===');
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      // Backend returns 400 when no exam schedule exists - treat as empty data
      if (error.response?.status === 400) {
        console.log('Returning empty data for 400 error');
        return {
          status: false,
          message: error.response?.data?.message || 'No Exam Schedule',
          data: [],
        };
      }
      throw error;
    }
  },
};
