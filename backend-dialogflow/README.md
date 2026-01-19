# Dialogflow CX Backend Integration

This folder contains the backend code for integrating Dialogflow CX chatbot with your Node.js/Express server.

## Files

```
backend-dialogflow/
├── services/
│   ├── dialogflowClient.js    # Dialogflow CX API client
│   └── sessionManager.js      # Session ID management
├── controller/
│   └── dialogflow.controller.js  # Request handlers
├── routes/
│   └── dialogflow.route.js    # Route definitions
└── README.md                  # This file
```

## Installation

### 1. Install Dependencies

Add to your backend's `package.json`:

```bash
npm install @google-cloud/dialogflow-cx
```

### 2. Copy Files to Your Backend

Copy the files to your existing backend structure:

```
backend/
├── src/
│   ├── services/
│   │   └── dialogflow/
│   │       ├── dialogflowClient.js
│   │       └── sessionManager.js
│   ├── controller/
│   │   └── chatbot/
│   │       └── dialogflow.controller.js
│   └── routes/
│       └── chatbot/
│           └── dialogflow.route.js
```

### 3. Update Import Paths

After copying, update the import paths in each file to match your project structure.

### 4. Register Routes

Add to your `mainRoute.js` or main router file:

```javascript
const dialogflowRoutes = require('./chatbot/dialogflow.route');

router.use('/chatbot/dialogflow', dialogflowRoutes);
```

### 5. Configure Environment Variables

Add to your backend `.env` file:

```env
# Dialogflow CX Configuration
DIALOGFLOW_PROJECT_ID=your-gcp-project-id
DIALOGFLOW_LOCATION=us-central1
DIALOGFLOW_AGENT_ID=your-agent-id
DIALOGFLOW_LANGUAGE=en

# Path to Google Cloud service account key
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## Google Cloud Setup

### 1. Create Dialogflow CX Agent

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable the Dialogflow CX API
4. Go to [Dialogflow CX Console](https://dialogflow.cloud.google.com/cx)
5. Create a new agent:
   - Display name: `SchoolParentAssistant`
   - Location: `us-central1`
   - Default language: English

### 2. Create Service Account

1. Go to IAM & Admin > Service Accounts
2. Click "Create Service Account"
3. Name: `dialogflow-client`
4. Grant role: `Dialogflow API Client`
5. Click "Create Key" > JSON
6. Download and store securely

### 3. Get Agent ID

1. Open your agent in Dialogflow CX console
2. The Agent ID is in the URL after `/agents/`
3. Example: `https://dialogflow.cloud.google.com/cx/.../agents/abc123-xyz`
   - Agent ID: `abc123-xyz`

## Creating Intents

### School Information Intents

1. Go to Build > Intents > + Create
2. Create these intents:

| Intent | Training Phrases |
|--------|-----------------|
| `school.hours` | "What are school hours?", "When does school start?", "School timing" |
| `school.contacts` | "School phone number", "Contact office", "Principal contact" |
| `school.holidays` | "Upcoming holidays", "When is vacation?", "Holiday list" |

### Student Query Intents

| Intent | Training Phrases |
|--------|-----------------|
| `student.homework` | "Pending homework", "Any homework?", "Homework due" |
| `student.attendance` | "Attendance record", "How many days absent?", "Attendance percentage" |
| `student.fees` | "Pending fees", "Fee status", "Fee due date" |

### Creating Flows

1. Go to Build > Flows > Default Start Flow
2. Click on "Start" node
3. Add routes for each intent
4. Set fulfillment (response text) for each route

Example flow:
```
Start
  └── Route: school.hours
      └── Fulfillment: "School hours are 8:00 AM to 3:00 PM, Monday to Friday."
  └── Route: school.contacts
      └── Fulfillment: "School Office: XXX-XXXX. Email: info@school.com"
  └── Route: Default Fallback
      └── Fulfillment: "I'm not sure about that. Try asking about school hours, homework, or attendance."
```

## API Endpoints

### POST /api/chatbot/dialogflow/message

Send a message to the chatbot.

**Request:**
```json
{
  "message": "What are the school hours?",
  "studentContext": {
    "id": "123",
    "name": "John Doe",
    "grade": "5th",
    "section": "A",
    "pendingHomework": 3
  },
  "resetSession": false
}
```

**Response:**
```json
{
  "status": true,
  "message": "Success",
  "data": {
    "sessionId": "user123-abc-xyz",
    "response": "School hours are 8:00 AM to 3:00 PM, Monday to Friday.",
    "intent": "school.hours",
    "confidence": 0.95,
    "parameters": {},
    "richContent": []
  }
}
```

### POST /api/chatbot/dialogflow/reset

Reset the conversation session.

**Response:**
```json
{
  "status": true,
  "message": "Session reset successfully"
}
```

### GET /api/chatbot/dialogflow/health

Health check endpoint.

**Response:**
```json
{
  "status": true,
  "message": "Dialogflow chatbot service is running",
  "data": {
    "activeSessions": 10,
    "sessionTTLMinutes": 30
  }
}
```

## Testing

### Test with cURL

```bash
# Health check
curl http://localhost:3000/api/chatbot/dialogflow/health

# Send message (replace TOKEN with valid JWT)
curl -X POST http://localhost:3000/api/chatbot/dialogflow/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message": "What are school hours?"}'
```

### Test in Dialogflow Console

1. Open your agent in Dialogflow CX
2. Click "Test Agent" in the top right
3. Type test messages
4. Verify intents are matched correctly

## Troubleshooting

### "Dialogflow CX client not initialized"
- Check `GOOGLE_APPLICATION_CREDENTIALS` path
- Verify service account JSON file exists
- Check file permissions

### "Permission denied" errors
- Verify service account has `Dialogflow API Client` role
- Check project ID matches

### No response / timeout
- Check `DIALOGFLOW_LOCATION` matches agent location
- Verify agent ID is correct
- Check network connectivity

## Future Enhancements

### Webhook Fulfillment (Phase 2)

For dynamic responses (real student data), add webhook fulfillment:

1. Create endpoint: `POST /api/chatbot/dialogflow/fulfillment`
2. Configure in Dialogflow CX > Manage > Webhooks
3. Query your APIs for student-specific data
