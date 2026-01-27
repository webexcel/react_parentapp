import { apiClient } from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';
import {
  GetMessagesRequest,
  GetMessagesResponse,
  SaveMessageRequest,
  SaveMessageResponse,
  DeleteMessageRequest,
  DeleteMessageResponse,
} from '../types/parentMessage.types';

export const parentMessageApi = {
  /**
   * Get all messages sent by parent for a specific student
   */
  getMessages: async (params: GetMessagesRequest): Promise<GetMessagesResponse> => {
    try {
      const response = await apiClient.post<GetMessagesResponse>(
        API_ENDPOINTS.PARENT_MESSAGE.GET_MESSAGES,
        params
      );
      return response.data;
    } catch (error: any) {
      // Backend returns 400 when no messages exist - treat as empty data
      if (error.response?.status === 400) {
        return {
          status: false,
          message: error.response?.data?.message || 'No messages',
          data: [],
        };
      }
      throw error;
    }
  },

  /**
   * Send a new message to school
   */
  saveMessage: async (params: SaveMessageRequest): Promise<SaveMessageResponse> => {
    const response = await apiClient.post<SaveMessageResponse>(
      API_ENDPOINTS.PARENT_MESSAGE.SAVE_MESSAGE,
      params
    );
    return response.data;
  },

  /**
   * Delete a message
   */
  deleteMessage: async (params: DeleteMessageRequest): Promise<DeleteMessageResponse> => {
    const response = await apiClient.post<DeleteMessageResponse>(
      API_ENDPOINTS.PARENT_MESSAGE.DELETE_MESSAGE,
      params
    );
    return response.data;
  },
};
