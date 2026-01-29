import {apiClient, API_ENDPOINTS} from '../../../core/api';
import {
  LeaveLetterResponse,
  LeaveRequest,
  InsertLeaveRequestPayload,
  UpdateLeaveRequestPayload,
} from '../types/leaveLetter.types';

export const leaveLetterApi = {
  /**
   * Get all leave requests for a student
   */
  getLeaveRequests: async (adno: string): Promise<LeaveLetterResponse> => {
    const response = await apiClient.post<LeaveLetterResponse>(
      API_ENDPOINTS.LEAVE_LETTER.GET,
      {ADNO: adno},
    );
    return response.data;
  },

  /**
   * Insert a new leave request
   */
  insertLeaveRequest: async (
    payload: InsertLeaveRequestPayload,
  ): Promise<LeaveLetterResponse> => {
    const response = await apiClient.post<LeaveLetterResponse>(
      API_ENDPOINTS.LEAVE_LETTER.INSERT,
      payload,
    );
    return response.data;
  },

  /**
   * Update an existing leave request
   */
  updateLeaveRequest: async (
    payload: UpdateLeaveRequestPayload,
  ): Promise<LeaveLetterResponse> => {
    const response = await apiClient.post<LeaveLetterResponse>(
      API_ENDPOINTS.LEAVE_LETTER.UPDATE,
      payload,
    );
    return response.data;
  },

  /**
   * Delete a leave request
   */
  deleteLeaveRequest: async (id: number): Promise<LeaveLetterResponse> => {
    const response = await apiClient.post<LeaveLetterResponse>(
      API_ENDPOINTS.LEAVE_LETTER.DELETE,
      {id},
    );
    return response.data;
  },
};
