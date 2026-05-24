import { apiClient } from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';
import {
  ExamScheduleRequest,
  ExamScheduleResponse,
} from '../types/examSchedule.types';

export const examScheduleApi = {
  getExamSchedule: async (params: ExamScheduleRequest): Promise<ExamScheduleResponse> => {
    try {
      const response = await apiClient.post<ExamScheduleResponse>(
        API_ENDPOINTS.EXAM_SCHEDULE.GET,
        params
      );
      return response.data;
    } catch (error: any) {
      // Backend returns 400 when no exam schedule exists - treat as empty data
      if (error.response?.status === 400) {
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
