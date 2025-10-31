# 🤖 AI Chatbot Backend - Setup Complete!

## ✅ What's Been Added

### 1. Backend Files Created
- ✅ `src/controllers/chatbotController.js` - Main chatbot logic with Google Gemini integration
- ✅ `src/routes/chatbotRoutes.js` - API routes for chatbot endpoints
- ✅ `app.js` - Updated to register chatbot routes

### 2. Dependencies Installed
- ✅ `@google/generative-ai` - Official Google Generative AI library

### 3. Documentation Created
- ✅ `CHATBOT_API.md` - Complete API documentation
- ✅ `CHATBOT_SETUP.md` - This file
- ✅ `test-chatbot.js` - API testing script

### 4. Configuration
- ✅ `.env` - Added GEMINI_API_KEY placeholder

## 🚀 Quick Start Guide

### Step 1: Get Your Google Gemini API Key (FREE!)
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

### Step 2: Configure Environment
Open `.env` file and replace the placeholder:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Step 3: Start the Server
```bash
npm start
# or for development
npm run dev
```

### Step 4: Test the Chatbot
The chatbot will be available at:
```
http://localhost:5000/chatbot
```

## 📡 API Endpoints

### 1. Check Status (Public)
```
GET http://localhost:5000/chatbot/status
```

### 2. Send Message (Protected)
```
POST http://localhost:5000/chatbot/chat
Headers: Authorization: Bearer <jwt_token>
Body: {
  "message": "Your message here",
  "conversationHistory": []
}
```

### 3. Clear Conversation (Protected)
```
POST http://localhost:5000/chatbot/clear
Headers: Authorization: Bearer <jwt_token>
```

## 🔗 Frontend Integration

### Your React App Should:
1. Get JWT token from login (already implemented)
2. Send POST requests to `/chatbot/chat` with token
3. Include conversation history for context
4. Display responses in your chat UI

### Example Request:
```javascript
const response = await fetch('http://localhost:5000/chatbot/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${yourJwtToken}`
  },
  body: JSON.stringify({
    message: userMessage,
    conversationHistory: previousMessages
  })
});

const data = await response.json();
console.log(data.message); // AI response
```

## 🎯 Features

✅ **AI-Powered Responses** - Uses OpenAI GPT-3.5-turbo
✅ **Context-Aware** - Maintains conversation history
✅ **Secure** - JWT authentication required
✅ **Automobile-Focused** - Specialized system prompt for auto services
✅ **Error Handling** - Comprehensive error responses
✅ **Status Monitoring** - Health check endpoint

## 🔧 Customization

### Change AI Model
Edit `src/controllers/chatbotController.js`:
```javascript
model: "gpt-4" // Change from gpt-3.5-turbo
```

### Customize Behavior
Modify the `SYSTEM_PROMPT` in `src/controllers/chatbotController.js`:
```javascript
const SYSTEM_PROMPT = `Your custom instructions here...`;
```

### Adjust Response Length
Change `max_tokens` parameter:
```javascript
max_tokens: 1000 // Increase for longer responses
```

## 🧪 Testing

### Test via Command Line:
```bash
# Check status
curl http://localhost:5000/chatbot/status

# Test chat (replace TOKEN with your JWT)
curl -X POST http://localhost:5000/chatbot/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message": "Hello!"}'
```

### Run Test Script:
```bash
node test-chatbot.js
```

## 💰 Cost Considerations

- **GPT-3.5-turbo**: ~$0.002 per 1K tokens (very affordable)
- **GPT-4**: ~$0.03 per 1K tokens (more expensive but better)

Typical conversation:
- User message: ~50 tokens
- AI response: ~200 tokens
- Cost per exchange: ~$0.0005 (half a cent) with GPT-3.5-turbo

Monitor usage at: https://platform.openai.com/usage

## 🛡️ Security Features

✅ API key stored in environment variables
✅ JWT authentication on all chat endpoints
✅ Input validation
✅ Error message sanitization in production
✅ Rate limiting ready (implement if needed)

## 📝 Next Steps

1. **Get API Key** - Sign up at OpenAI and get your API key
2. **Add to .env** - Configure OPENAI_API_KEY
3. **Test Backend** - Use curl or test-chatbot.js
4. **Connect Frontend** - Update your React app to call the API
5. **Customize** - Adjust system prompt and settings
6. **Deploy** - Deploy to your production server

## 🆘 Troubleshooting

### "OpenAI API key is invalid or missing"
- Check that OPENAI_API_KEY is set in .env
- Verify the API key is correct
- Restart the server after adding the key

### "Not authorized" errors
- Ensure JWT token is included in Authorization header
- Format: `Bearer <token>`
- Token should be from /auth/login endpoint

### "Quota exceeded"
- Check your OpenAI account usage limits
- Add payment method if needed
- Consider implementing rate limiting

## 📚 Resources

- OpenAI API Docs: https://platform.openai.com/docs
- OpenAI Playground: https://platform.openai.com/playground
- Pricing: https://openai.com/pricing
- Usage Dashboard: https://platform.openai.com/usage

---

## Need Help?

- Check `CHATBOT_API.md` for detailed API documentation
- See `REACT_INTEGRATION_EXAMPLE.jsx` for frontend examples
- Review server logs for error details

**Happy Coding! 🚀**
