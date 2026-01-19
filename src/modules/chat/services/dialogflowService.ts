import { apiClient } from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';
import {
  StudentContext,
  DialogflowResponse,
  ChatServiceInterface,
} from '../types/chat.types';

/**
 * Dialogflow CX Service
 * Communicates with backend proxy to interact with Dialogflow CX agent
 */
class DialogflowService implements ChatServiceInterface {
  private studentContext: StudentContext | null = null;
  private isReady: boolean = false;
  private sessionId: string | null = null;

  /**
   * Initialize the service
   * Dialogflow uses backend proxy, so it's always ready if API is configured
   */
  initialize(): boolean {
    this.isReady = true;
    return true;
  }

  /**
   * Set the current student context for personalized responses
   */
  setStudentContext(context: StudentContext): void {
    this.studentContext = context;
    // Don't reset session on context change - Dialogflow handles context via parameters
  }

  /**
   * Send a message to Dialogflow CX via backend proxy
   */
  async sendMessage(message: string): Promise<string> {
    try {
      const response = await apiClient.post<{
        status: boolean;
        message: string;
        data: DialogflowResponse;
      }>(API_ENDPOINTS.CHATBOT.DIALOGFLOW_MESSAGE, {
        message,
        studentContext: this.studentContext,
        resetSession: false,
      });

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to get response');
      }

      const { data } = response.data;
      this.sessionId = data.sessionId;

      // Return the fulfillment text
      return data.response;
    } catch (error: any) {
      console.error('Dialogflow API error:', error);

      // Handle specific error codes
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (error.response?.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }

      if (error.response?.status === 503) {
        throw new Error('Chatbot service is temporarily unavailable. Please try again later.');
      }

      // Network error
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Network error. Please check your internet connection.');
      }

      throw new Error(
        error.response?.data?.message ||
          'Failed to get response. Please try again.'
      );
    }
  }

  /**
   * Reset the conversation session
   */
  async resetChat(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.CHATBOT.DIALOGFLOW_RESET);
      this.sessionId = null;
    } catch (error) {
      console.error('Failed to reset Dialogflow session:', error);
      // Don't throw - just log the error and continue
    }
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.isReady;
  }

  /**
   * Get the current session ID (for debugging)
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get the current student context
   */
  getStudentContext(): StudentContext | null {
    return this.studentContext;
  }
}

// Export singleton instance
export const dialogflowService = new DialogflowService();
