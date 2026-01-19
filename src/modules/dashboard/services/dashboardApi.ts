import { apiClient } from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';
import {
  BatchCountResponse,
  FlashMessageResponse,
  LatestMessageResponse,
  FeeBalanceResponse,
  IdCardResponse,
  FeesFlashResponse,
} from '../types/dashboard.types';

export const dashboardApi = {
  /**
   * Get batch count data for a student
   * Returns circulars count, attendance %, homework count, payment due
   * Sends students array with adno and class_id
   */
  getBatchCount: async (adno: string, classId?: string): Promise<BatchCountResponse> => {
    // Backend expects ADNO as an array of admission numbers
    const payload = {
      ADNO: [adno],
    };

    const response = await apiClient.post<BatchCountResponse>(
      API_ENDPOINTS.DASHBOARD.BATCH_COUNT,
      payload
    );
    return response.data;
  },

  /**
   * Get flash messages (time-bounded announcements)
   */
  getFlashMessage: async (): Promise<FlashMessageResponse> => {
    const response = await apiClient.get<FlashMessageResponse>(
      API_ENDPOINTS.DASHBOARD.FLASH_MESSAGE
    );
    return response.data;
  },

  /**
   * Get latest messages/circulars for today
   */
  getLatestMessage: async (mobileNumber: string): Promise<LatestMessageResponse> => {
    const response = await apiClient.post<LatestMessageResponse>(
      API_ENDPOINTS.DASHBOARD.LATEST_MESSAGE,
      { mobile_number: mobileNumber }
    );
    return response.data;
  },

  /**
   * Check fees balance for multiple students
   */
  checkFeesBalance: async (admissionIds: string[]): Promise<FeeBalanceResponse> => {
    const response = await apiClient.post<FeeBalanceResponse>(
      API_ENDPOINTS.DASHBOARD.CHECK_FEES_BALANCE,
      { adno: admissionIds }
    );
    return response.data;
  },

  /**
   * Get student ID card details
   */
  getIdCard: async (admissionIds: string): Promise<IdCardResponse> => {
    const response = await apiClient.post<IdCardResponse>(
      API_ENDPOINTS.DASHBOARD.GET_ID_CARD,
      { adno: admissionIds }
    );
    return response.data;
  },

  /**
   * Quick check for fees pending status
   */
  getFeesFlash: async (adno: string): Promise<FeesFlashResponse> => {
    const response = await apiClient.post<FeesFlashResponse>(
      API_ENDPOINTS.DASHBOARD.FEES_FLASH,
      { adno }
    );
    return response.data;
  },
};
