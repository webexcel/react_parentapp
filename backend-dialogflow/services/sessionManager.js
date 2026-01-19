/**
 * Session Manager for Dialogflow CX
 *
 * Manages unique session IDs for each user/conversation.
 * Sessions are used by Dialogflow CX to maintain conversation context.
 *
 * Features:
 * - Generates unique session IDs per user
 * - In-memory storage with TTL (can be extended to Redis)
 * - Session reset functionality for new conversations
 */

const crypto = require('crypto');

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.SESSION_TTL = 30 * 60 * 1000; // 30 minutes

    // Start cleanup interval
    this._startCleanupInterval();
  }

  /**
   * Generate a unique session ID
   * @param {string} userId - User identifier
   * @returns {string} Unique session ID
   */
  _generateSessionId(userId) {
    const uuid = crypto.randomUUID();
    return `${userId}-${uuid}`;
  }

  /**
   * Get the cache key for a user session
   * @param {string} userId - User identifier
   * @param {string} dbname - Database/school identifier
   * @returns {string} Cache key
   */
  _getCacheKey(userId, dbname) {
    return `dialogflow:session:${dbname}:${userId}`;
  }

  /**
   * Get or create a session for a user
   * @param {string} userId - User identifier
   * @param {string} dbname - Database/school identifier
   * @returns {Promise<string>} Session ID
   */
  async getOrCreateSession(userId, dbname) {
    const key = this._getCacheKey(userId, dbname);

    // Check for existing session
    const existing = this.sessions.get(key);
    if (existing && Date.now() - existing.createdAt < this.SESSION_TTL) {
      // Update last accessed time
      existing.lastAccessed = Date.now();
      return existing.sessionId;
    }

    // Create new session
    const sessionId = this._generateSessionId(userId);
    this.sessions.set(key, {
      sessionId,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    });

    return sessionId;
  }

  /**
   * Reset a user's session (for starting new conversations)
   * @param {string} userId - User identifier
   * @param {string} dbname - Database/school identifier
   */
  async resetSession(userId, dbname) {
    const key = this._getCacheKey(userId, dbname);
    this.sessions.delete(key);
  }

  /**
   * Check if a session exists and is valid
   * @param {string} userId - User identifier
   * @param {string} dbname - Database/school identifier
   * @returns {boolean} Whether session exists and is valid
   */
  hasValidSession(userId, dbname) {
    const key = this._getCacheKey(userId, dbname);
    const existing = this.sessions.get(key);

    if (!existing) return false;
    if (Date.now() - existing.createdAt >= this.SESSION_TTL) {
      this.sessions.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Start periodic cleanup of expired sessions
   */
  _startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, session] of this.sessions.entries()) {
        if (now - session.lastAccessed >= this.SESSION_TTL) {
          this.sessions.delete(key);
        }
      }
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  /**
   * Get session statistics (for debugging/monitoring)
   * @returns {Object} Session statistics
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      ttlMinutes: this.SESSION_TTL / 60000,
    };
  }
}

// Export singleton instance
module.exports = new SessionManager();
