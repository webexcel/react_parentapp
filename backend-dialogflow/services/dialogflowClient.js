/**
 * Dialogflow CX Client Service
 *
 * This service initializes and manages the connection to Dialogflow CX.
 *
 * Required environment variables:
 * - DIALOGFLOW_PROJECT_ID: Your Google Cloud project ID
 * - DIALOGFLOW_LOCATION: The location of your Dialogflow CX agent (e.g., 'us-central1')
 * - DIALOGFLOW_AGENT_ID: The ID of your Dialogflow CX agent
 * - DIALOGFLOW_LANGUAGE: Language code (default: 'en')
 * - GOOGLE_APPLICATION_CREDENTIALS: Path to service account JSON file
 */

const { SessionsClient } = require('@google-cloud/dialogflow-cx');

class DialogflowCXClient {
  constructor() {
    this.projectId = process.env.DIALOGFLOW_PROJECT_ID;
    this.location = process.env.DIALOGFLOW_LOCATION || 'us-central1';
    this.agentId = process.env.DIALOGFLOW_AGENT_ID;
    this.languageCode = process.env.DIALOGFLOW_LANGUAGE || 'en';
    this.client = null;

    this._initializeClient();
  }

  _initializeClient() {
    try {
      // Initialize the Dialogflow CX Sessions client
      // Uses GOOGLE_APPLICATION_CREDENTIALS env var for authentication
      this.client = new SessionsClient({
        apiEndpoint: `${this.location}-dialogflow.googleapis.com`,
      });
      console.log('Dialogflow CX client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Dialogflow CX client:', error);
      throw error;
    }
  }

  /**
   * Get the session path for Dialogflow CX
   * @param {string} sessionId - Unique session identifier
   * @returns {string} Full session path
   */
  getSessionPath(sessionId) {
    return this.client.projectLocationAgentSessionPath(
      this.projectId,
      this.location,
      this.agentId,
      sessionId
    );
  }

  /**
   * Detect intent from user input
   * @param {string} sessionId - Unique session identifier
   * @param {string} text - User input text
   * @param {Object} parameters - Additional parameters (student context)
   * @returns {Object} Dialogflow CX response
   */
  async detectIntent(sessionId, text, parameters = {}) {
    if (!this.client) {
      throw new Error('Dialogflow CX client not initialized');
    }

    const sessionPath = this.getSessionPath(sessionId);

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: text,
        },
        languageCode: this.languageCode,
      },
    };

    // Add session parameters if provided (student context)
    if (Object.keys(parameters).length > 0) {
      request.queryParams = {
        parameters: this._convertToStructValue(parameters),
      };
    }

    try {
      const [response] = await this.client.detectIntent(request);
      return response;
    } catch (error) {
      console.error('Dialogflow CX detectIntent error:', error);
      throw error;
    }
  }

  /**
   * Convert plain object to Struct Value format for Dialogflow
   * @param {Object} obj - Plain JavaScript object
   * @returns {Object} Struct Value format object
   */
  _convertToStructValue(obj) {
    const structValue = { fields: {} };

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (typeof value === 'string') {
        structValue.fields[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        structValue.fields[key] = { numberValue: value };
      } else if (typeof value === 'boolean') {
        structValue.fields[key] = { boolValue: value };
      }
    }

    return structValue;
  }

  /**
   * Extract fulfillment text from Dialogflow response
   * @param {Object} response - Dialogflow CX response
   * @returns {string} Combined fulfillment text
   */
  extractFulfillmentText(response) {
    const queryResult = response.queryResult;

    if (!queryResult || !queryResult.responseMessages) {
      return 'I could not understand that. Please try again.';
    }

    const texts = queryResult.responseMessages
      .filter(msg => msg.text && msg.text.text)
      .flatMap(msg => msg.text.text)
      .filter(Boolean);

    return texts.join('\n') || 'I could not understand that. Please try again.';
  }

  /**
   * Get intent information from response
   * @param {Object} response - Dialogflow CX response
   * @returns {Object} Intent name and confidence
   */
  getIntentInfo(response) {
    const queryResult = response.queryResult;

    return {
      intentName: queryResult?.match?.intent?.displayName || 'Unknown',
      confidence: queryResult?.match?.confidence || 0,
    };
  }
}

// Export singleton instance
module.exports = new DialogflowCXClient();
