import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the Gemini model
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-exp",
  systemInstruction: `You are an AI assistant for an Automobile Management System. Your role is to help users with:
- Information about vehicles and automobile services
- Booking appointments for vehicle maintenance
- Answering questions about car parts and accessories
- General automotive advice and troubleshooting
- Information about the automobile system features

Be helpful, professional, and concise in your responses. If you're unsure about something, be honest about it.`
});

/**
 * Handle chat messages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const chat = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    // Validate input
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid message",
      });
    }

    // Create chat session with history
    const chat = model.startChat({
      history: conversationHistory.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const aiResponse = result.response.text();

    // Return response
    res.status(200).json({
      success: true,
      message: aiResponse,
      conversationHistory: [
        ...conversationHistory,
        { role: "user", content: message },
        { role: "assistant", content: aiResponse },
      ],
    });
  } catch (error) {
    console.error("Chatbot error:", error);

    // Handle specific Gemini errors
    if (error.message?.includes("API_KEY")) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is invalid or missing",
      });
    }

    if (error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      return res.status(500).json({
        success: false,
        message: "API quota exceeded. Please try again later.",
      });
    }

    res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Clear conversation history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const clearConversation = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Conversation cleared successfully",
    });
  } catch (error) {
    console.error("Clear conversation error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while clearing the conversation",
    });
  }
};

/**
 * Get chatbot status/health check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getStatus = async (req, res) => {
  try {
    const isConfigured = !!process.env.GEMINI_API_KEY;

    res.status(200).json({
      success: true,
      status: "online",
      configured: isConfigured,
      model: "gemini-2.0-flash-exp",
      message: isConfigured
        ? "Chatbot is ready (Google Gemini 2.0 Flash)"
        : "Gemini API key not configured",
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      success: false,
      status: "error",
      message: "An error occurred while checking chatbot status",
    });
  }
};
