import { apiClient } from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';
import {
  MarksRequest,
  MarksResponse,
  ExamListResponse,
  SelectExamNameRequest,
  SelectExamNameResponse,
  ReportCardRequest,
  ReportCardResponse,
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
    try {
      const response = await apiClient.post<SelectExamNameResponse>(
        API_ENDPOINTS.MARKS.SELECT_EXAM_NAME,
        params
      );
      return response.data;
    } catch (error: any) {
      // Backend returns 400 when no exams exist - treat as empty data
      if (error.response?.status === 400) {
        return {
          status: false,
          message: error.response?.data?.message || 'No Data',
          examdata: [],
        };
      }
      throw error;
    }
  },

  getMarksByAdno: async (params: MarksRequest): Promise<MarksResponse> => {
    try {
      const response = await apiClient.post<MarksResponse>(
        API_ENDPOINTS.MARKS.GET_BY_ADNO,
        params
      );
      return response.data;
    } catch (error: any) {
      // Backend returns 400 when no marks exist - treat as empty data
      if (error.response?.status === 400) {
        return {
          status: false,
          message: error.response?.data?.message || 'No Data',
          data: {
            marks: [],
            exam_name: '',
            student_name: '',
            class: '',
          },
        };
      }
      throw error;
    }
  },

  // Get report card URL for a specific exam
  getTermReportcard: async (params: ReportCardRequest): Promise<ReportCardResponse> => {
    try {
      const response = await apiClient.post<ReportCardResponse>(
        API_ENDPOINTS.MARKS.GET_TERM_REPORTCARD,
        params
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        return {
          status: false,
          message: error.response?.data?.message || 'No Report Card Available',
          data: '',
        };
      }
      throw error;
    }
  },
};
