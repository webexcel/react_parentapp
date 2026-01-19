/**
 * Dialogflow CX Routes
 *
 * Routes for chatbot functionality using Dialogflow CX.
 * All routes require JWT authentication via verifyToken middleware.
 *
 * Base path: /api/chatbot/dialogflow
 *
 * Endpoints:
 * - POST /message - Send message to chatbot
 * - POST /reset - Reset conversation session
 * - GET /health - Health check (no auth required)
 */

const express = require('express');
const router = express.Router();
const dialogflowController = require('../controller/dialogflow.controller');

// Import your existing middleware
// const verifyToken = require('../../src/middleware/verifyToken');

/**
 * Placeholder verifyToken middleware
 * Replace this with your actual verifyToken import from your existing backend
 */
const verifyToken = (req, res, next) => {
  // This is a placeholder - use your existing verifyToken middleware
  // Your middleware should:
  // 1. Extract JWT from Authorization header
  // 2. Verify and decode the token
  // 3. Set req.user = { UserId, dbname, user_name }
  // 4. Call next() or return 401 if invalid

  // Example implementation:
  /*
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ status: false, message: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ status: false, message: 'Invalid token' });
  }
  */

  next(); // Remove this and uncomment above in production
};

/**
 * POST /api/chatbot/dialogflow/message
 * Send a message to the chatbot
 *
 * Request body:
 * {
 *   "message": "What are the school hours?",
 *   "studentContext": {
 *     "id": "123",
 *     "name": "John Doe",
 *     "grade": "5th",
 *     "section": "A"
 *   },
 *   "resetSession": false
 * }
 *
 * Response:
 * {
 *   "status": true,
 *   "message": "Success",
 *   "data": {
 *     "sessionId": "user123-uuid",
 *     "response": "School hours are 8:00 AM to 3:00 PM.",
 *     "intent": "school.hours",
 *     "confidence": 0.95
 *   }
 * }
 */
router.post('/message', verifyToken, dialogflowController.sendMessage);

/**
 * POST /api/chatbot/dialogflow/reset
 * Reset the conversation session
 *
 * Response:
 * {
 *   "status": true,
 *   "message": "Session reset successfully"
 * }
 */
router.post('/reset', verifyToken, dialogflowController.resetSession);

/**
 * GET /api/chatbot/dialogflow/health
 * Health check endpoint (no authentication required)
 *
 * Response:
 * {
 *   "status": true,
 *   "message": "Dialogflow chatbot service is running",
 *   "data": {
 *     "activeSessions": 10,
 *     "sessionTTLMinutes": 30
 *   }
 * }
 */
router.get('/health', dialogflowController.healthCheck);

module.exports = router;
