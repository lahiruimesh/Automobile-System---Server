import express from "express";
import {
  chat,
  clearConversation,
  getStatus,
} from "../controllers/chatbotController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route - check chatbot status
router.get("/status", getStatus);

// Protected routes - require authentication
router.post("/chat", protect, chat);
router.post("/clear", protect, clearConversation);

export default router;
