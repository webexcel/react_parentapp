import { apiClient } from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';
import {
  MarksRequest,
  MarksResponse,
  ExamListResponse,
  SelectExamNameRequest,
  SelectExamNameResponse,
} from '../types/marks.types';

export const marksApi = {
  getAllExams: async (): Promise<ExamListResponse> => {
    const response = await apiClient.post<ExamListResponse>(
      API_ENDPOINTS.EXAM_SCHEDULE.GET_ALL_EXAMS,
      {}
    );
    return response.data;
  },

  // Get exams by class_id - returns exams that have marks configured
  selectExamName: async (params: SelectExamNameRequest): Promise<SelectExamNameResponse> => {
    const response = await apiClient.post<SelectExamNameResponse>(
      API_ENDPOINTS.MARKS.SELECT_EXAM_NAME,
      params
    );
    return response.data;
  },

  getMarksByAdno: async (params: MarksRequest): Promise<MarksResponse> => {
    const response = await apiClient.post<MarksResponse>(
      API_ENDPOINTS.MARKS.GET_BY_ADNO,
      params
    );
    return response.data;
  },
};
