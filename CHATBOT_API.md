# AI Chatbot API Documentation

## Overview
This backend provides AI-powered chatbot functionality for the Automobile Management System using Google Gemini 2.0 Flash (FREE).

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Google Gemini API Key
1. Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account (FREE, no credit card required)
3. Click "Create API Key"
4. Add it to your `.env` file:
```
GEMINI_API_KEY=your_actual_api_key_here
```

## API Endpoints

### Base URL
```
http://localhost:5000/chatbot
```

### 1. Check Chatbot Status
**GET** `/chatbot/status`

**Description:** Check if the chatbot is configured and online.

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "status": "online",
  "configured": true,
  "model": "gemini-2.0-flash-exp",
  "message": "Chatbot is ready (Google Gemini 2.0 Flash)"
}
```

---

### 2. Send Chat Message
**POST** `/chatbot/chat`

**Description:** Send a message to the AI chatbot and receive a response.

**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "What services do you offer?",
  "conversationHistory": []
}
```

**Request Parameters:**
- `message` (string, required): The user's message to the chatbot
- `conversationHistory` (array, optional): Array of previous messages to maintain context

**Response:**
```json
{
  "success": true,
  "message": "We offer a wide range of automobile services including...",
  "conversationHistory": [
    {
      "role": "user",
      "content": "What services do you offer?"
    },
    {
      "role": "assistant",
      "content": "We offer a wide range of automobile services including..."
    }
  ]
}
```

---

### 3. Clear Conversation
**POST** `/chatbot/clear`

**Description:** Clear the conversation history (client-side operation).

**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation cleared successfully"
}
```

---

## Frontend Integration Example

### Basic Chat Request
```javascript
const sendMessage = async (message, conversationHistory = []) => {
  try {
    const token = localStorage.getItem('token'); // Your JWT token
    
    const response = await fetch('http://localhost:5000/chatbot/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: message,
        conversationHistory: conversationHistory
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // Update your UI with data.message
      // Store data.conversationHistory for next request
      return data;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### Maintaining Conversation Context
```javascript
// Store conversation in component state
const [conversationHistory, setConversationHistory] = useState([]);

const handleSendMessage = async (userMessage) => {
  const response = await sendMessage(userMessage, conversationHistory);
  
  if (response.success) {
    // Update conversation history
    setConversationHistory(response.conversationHistory);
  }
};
```

## Error Handling

### Common Error Responses

**Invalid Message:**
```json
{
  "success": false,
  "message": "Please provide a valid message"
}
```

**Authentication Error:**
```json
{
  "success": false,
  "message": "Not authorized"
}
```

**API Key Error:**
```json
{
  "success": false,
  "message": "Gemini API key is invalid or missing"
}
```

**Quota Exceeded:**
```json
{
  "success": false,
  "message": "API quota exceeded. Please try again later."
}
```

## Configuration Options

### Changing Response Settings
In `src/controllers/chatbotController.js`, you can adjust the generation config:

```javascript
generationConfig: {
  maxOutputTokens: 1000, // Increase for longer responses
  temperature: 0.7,      // 0.0-1.0 (lower=more focused, higher=more creative)
}
```

### Customizing the System Instruction
Modify the `systemInstruction` in the model initialization to change the chatbot's behavior.

## Security Notes

1. **API Key Protection:** Never expose your Gemini API key in client-side code
2. **Authentication:** All chat endpoints (except status) require JWT authentication
3. **Rate Limiting:** Consider implementing rate limiting to prevent API abuse
4. **Input Validation:** Messages are validated before being sent to Gemini

## 💰 Cost & Limits

### **100% FREE!** 🎉

**Google Gemini 2.0 Flash Experimental:**
- ✅ **Cost:** $0 (Completely FREE)
- ✅ **Rate Limits:** 15 requests/minute, 1 million tokens/minute
- ✅ **Daily Quota:** 1,500 requests per day
- ✅ **No Credit Card Required**

Perfect for development and production use!

Monitor your usage at [Google AI Studio](https://aistudio.google.com/)

## Testing

### Test the Status Endpoint
```bash
curl http://localhost:5000/chatbot/status
```

### Test the Chat Endpoint
```bash
curl -X POST http://localhost:5000/chatbot/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "Hello, what services do you offer?"}'
```

## Support

For issues or questions:
1. Check Google AI Studio status: https://aistudio.google.com/
2. Review Gemini API documentation: https://ai.google.dev/docs
3. Check server logs for detailed error messages
