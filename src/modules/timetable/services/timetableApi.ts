import { apiClient, API_ENDPOINTS } from '../../../core/api';
import { TimetableResponse } from '../types/timetable.types';

export const timetableApi = {
  getStudentTimetable: async (classId: string): Promise<TimetableResponse> => {
    const response = await apiClient.post<TimetableResponse>(
      API_ENDPOINTS.TIMETABLE.GET_STUDENT,
      { class_id: classId },
    );
    return response.data;
  },
};
