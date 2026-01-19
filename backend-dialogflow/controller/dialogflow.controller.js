/**
 * Dialogflow CX Controller
 *
 * Handles HTTP requests for chatbot functionality.
 * Integrates with Dialogflow CX via the client service.
 *
 * Endpoints:
 * - POST /message - Send message to Dialogflow CX
 * - POST /reset - Reset conversation session
 */

const dialogflowClient = require('../services/dialogflowClient');
const sessionManager = require('../services/sessionManager');

// Response codes (should match your existing backend constants)
const RESPONSE_CODES = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

const dialogflowController = {
  /**
   * POST /api/chatbot/dialogflow/message
   * Send a message to Dialogflow CX and get response
   */
  sendMessage: async (req, res) => {
    try {
      const { message, studentContext, resetSession } = req.body;

      // User info from JWT token (set by verifyToken middleware)
      const { UserId, dbname } = req.user || {};

      // Validate required fields
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({
          status: false,
          message: 'Message is required and must be a non-empty string',
        });
      }

      if (!UserId || !dbname) {
        return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
          status: false,
          message: 'User authentication required',
        });
      }

      // Reset session if requested
      if (resetSession) {
        await sessionManager.resetSession(UserId, dbname);
      }

      // Get or create session
      const sessionId = await sessionManager.getOrCreateSession(UserId, dbname);

      // Build parameters from student context
      const parameters = {};
      if (studentContext) {
        if (studentContext.name) parameters.studentName = studentContext.name;
        if (studentContext.grade) parameters.studentGrade = studentContext.grade;
        if (studentContext.section) parameters.studentSection = studentContext.section;
        if (studentContext.id) parameters.studentId = studentContext.id;
        if (studentContext.pendingHomework !== undefined) {
          parameters.pendingHomework = studentContext.pendingHomework;
        }
        if (studentContext.attendancePercent) {
          parameters.attendancePercent = studentContext.attendancePercent;
        }
        if (studentContext.pendingFees !== undefined) {
          parameters.pendingFees = studentContext.pendingFees;
        }
      }

      // Call Dialogflow CX
      const response = await dialogflowClient.detectIntent(
        sessionId,
        message.trim(),
        parameters
      );

      // Extract response data
      const fulfillmentText = dialogflowClient.extractFulfillmentText(response);
      const intentInfo = dialogflowClient.getIntentInfo(response);

      // Extract any rich content/custom payload
      const richContent = response.queryResult?.responseMessages
        ?.filter(msg => msg.payload)
        .map(msg => msg.payload) || [];

      return res.status(RESPONSE_CODES.SUCCESS).json({
        status: true,
        message: 'Success',
        data: {
          sessionId,
          response: fulfillmentText,
          intent: intentInfo.intentName,
          confidence: intentInfo.confidence,
          parameters: response.queryResult?.parameters?.fields || {},
          richContent,
        },
      });
    } catch (error) {
      console.error('Dialogflow sendMessage error:', error);

      // Handle specific Dialogflow errors
      if (error.code === 7 || error.code === 'PERMISSION_DENIED') {
        return res.status(RESPONSE_CODES.SERVICE_UNAVAILABLE).json({
          status: false,
          message: 'Chatbot service configuration error. Please contact support.',
        });
      }

      if (error.code === 14 || error.code === 'UNAVAILABLE') {
        return res.status(RESPONSE_CODES.SERVICE_UNAVAILABLE).json({
          status: false,
          message: 'Chatbot service is temporarily unavailable. Please try again later.',
        });
      }

      return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: 'Failed to process message. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  /**
   * POST /api/chatbot/dialogflow/reset
   * Reset conversation session
   */
  resetSession: async (req, res) => {
    try {
      const { UserId, dbname } = req.user || {};

      if (!UserId || !dbname) {
        return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
          status: false,
          message: 'User authentication required',
        });
      }

      await sessionManager.resetSession(UserId, dbname);

      return res.status(RESPONSE_CODES.SUCCESS).json({
        status: true,
        message: 'Session reset successfully',
      });
    } catch (error) {
      console.error('Dialogflow resetSession error:', error);

      return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: 'Failed to reset session',
      });
    }
  },

  /**
   * GET /api/chatbot/dialogflow/health
   * Health check endpoint
   */
  healthCheck: async (req, res) => {
    try {
      const stats = sessionManager.getStats();

      return res.status(RESPONSE_CODES.SUCCESS).json({
        status: true,
        message: 'Dialogflow chatbot service is running',
        data: {
          activeSessions: stats.activeSessions,
          sessionTTLMinutes: stats.ttlMinutes,
        },
      });
    } catch (error) {
      return res.status(RESPONSE_CODES.SERVICE_UNAVAILABLE).json({
        status: false,
        message: 'Chatbot service health check failed',
      });
    }
  },
};

module.exports = dialogflowController;
