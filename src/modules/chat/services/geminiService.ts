import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import Config from 'react-native-config';

// Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface StudentContext {
  name: string;
  grade: string;
  section: string;
  rollNumber?: string;
  recentAttendance?: string;
  recentMarks?: string;
  pendingHomework?: number;
  pendingFees?: number;
}

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a helpful AI assistant for a school parent app called "Crescent Parent App". Your role is to help parents with questions about:

1. **Academic Progress**: Explain grades, marks, and academic performance
2. **Homework Help**: Provide guidance on homework topics (not direct answers)
3. **School Policies**: Answer questions about school rules, timings, and procedures
4. **Attendance**: Explain attendance records and policies
5. **Fee Information**: Help understand fee structures and payment deadlines
6. **School Events**: Provide information about upcoming events and activities
7. **General Queries**: Answer general questions about education and child development

Guidelines:
- Be friendly, professional, and supportive
- Keep responses concise but informative
- If you don't know specific school information, acknowledge it and suggest contacting the school directly
- For homework help, guide towards understanding rather than giving direct answers
- Respect privacy and don't ask for sensitive information
- Use simple language that's easy to understand
- When discussing student data provided in context, be specific and helpful

Current Student Context (if available):
{STUDENT_CONTEXT}

Remember: You're here to make the parent's experience easier and help them stay connected with their child's education.`;

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private chatSession: ChatSession | null = null;
  private studentContext: StudentContext | null = null;

  initialize(apiKey?: string): boolean {
    const key = apiKey || Config.GEMINI_API_KEY;

    if (!key || key === 'your_gemini_api_key_here') {
      console.warn('Gemini API key not configured');
      return false;
    }

    try {
      this.genAI = new GoogleGenerativeAI(key);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      return true;
    } catch (error) {
      console.error('Failed to initialize Gemini:', error);
      return false;
    }
  }

  setStudentContext(context: StudentContext) {
    this.studentContext = context;
    // Reset chat session when context changes
    this.chatSession = null;
  }

  private getSystemPromptWithContext(): string {
    let contextString = 'No specific student selected.';

    if (this.studentContext) {
      const ctx = this.studentContext;
      contextString = `
- Student Name: ${ctx.name}
- Grade: ${ctx.grade}
- Section: ${ctx.section}
${ctx.rollNumber ? `- Roll Number: ${ctx.rollNumber}` : ''}
${ctx.recentAttendance ? `- Recent Attendance: ${ctx.recentAttendance}` : ''}
${ctx.recentMarks ? `- Recent Academic Performance: ${ctx.recentMarks}` : ''}
${ctx.pendingHomework !== undefined ? `- Pending Homework: ${ctx.pendingHomework} assignments` : ''}
${ctx.pendingFees !== undefined ? `- Pending Fees: ₹${ctx.pendingFees}` : ''}`;
    }

    return SYSTEM_PROMPT.replace('{STUDENT_CONTEXT}', contextString);
  }

  private startNewChat() {
    if (!this.model) {
      throw new Error('Gemini model not initialized');
    }

    const systemPrompt = this.getSystemPromptWithContext();

    this.chatSession = this.model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `System Instructions: ${systemPrompt}` }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I\'m ready to help parents with their questions about their child\'s education, school activities, and academic progress. How can I assist you today?' }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini not initialized. Please configure your API key.');
    }

    if (!this.chatSession) {
      this.startNewChat();
    }

    try {
      const result = await this.chatSession!.sendMessage(message);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini API error:', error);

      if (error.message?.includes('API key')) {
        throw new Error('Invalid API key. Please check your Gemini API key configuration.');
      }

      if (error.message?.includes('quota')) {
        throw new Error('API quota exceeded. Please try again later.');
      }

      throw new Error('Failed to get response. Please try again.');
    }
  }

  async sendSingleMessage(message: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini not initialized. Please configure your API key.');
    }

    try {
      const systemPrompt = this.getSystemPromptWithContext();
      const fullPrompt = `${systemPrompt}\n\nUser Question: ${message}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to get response. Please try again.');
    }
  }

  resetChat() {
    this.chatSession = null;
  }

  isInitialized(): boolean {
    return this.model !== null;
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
