import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { getCustomerDashboard } from "../controllers/customerController.js";

const router = express.Router();

// Customer dashboard - protected route
router.get("/dashboard", authenticateToken, getCustomerDashboard);

export default router;