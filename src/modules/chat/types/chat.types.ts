/**
 * Shared types for chat module - supports both Gemini and Dialogflow providers
 */

export type ChatProvider = 'gemini' | 'dialogflow';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  provider?: ChatProvider;
  // Dialogflow-specific metadata
  intent?: string;
  confidence?: number;
  richContent?: any[];
}

export interface StudentContext {
  id?: string;
  name: string;
  grade: string;
  section: string;
  rollNumber?: string;
  recentAttendance?: string;
  recentMarks?: string;
  pendingHomework?: number;
  pendingFees?: number;
  attendancePercent?: string;
}

export interface DialogflowResponse {
  sessionId: string;
  response: string;
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
  richContent?: any[];
}

export interface ChatProviderConfig {
  provider: ChatProvider;
  isInitialized: boolean;
  error?: string;
}

/**
 * Common interface for chat service implementations
 * Both GeminiService and DialogflowService should implement this
 */
export interface ChatServiceInterface {
  initialize(): boolean;
  sendMessage(message: string): Promise<string>;
  setStudentContext(context: StudentContext): void;
  resetChat(): void;
  isInitialized(): boolean;
}
