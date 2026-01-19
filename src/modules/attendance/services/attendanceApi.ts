import { apiClient, API_ENDPOINTS } from '../../../core/api';
import { AttendanceResponse } from '../types/attendance.types';

export const attendanceApi = {
  /**
   * Get attendance for a student
   * Backend expects ADNO (Admission Number) field
   */
  getAttendance: async (
    studentId: string,
    month?: number,
    year?: number
  ): Promise<AttendanceResponse> => {
    const response = await apiClient.post<AttendanceResponse>(
      API_ENDPOINTS.ATTENDANCE.GET,
      { ADNO: studentId, month, year }
    );
    return response.data;
  },
};
