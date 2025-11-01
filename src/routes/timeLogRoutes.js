import express from "express";
import {
  getMyAssignments,
  getAssignmentById,
  createTimeLog,
  getMyTimeLogs,
  updateTimeLog,
  deleteTimeLog,
  getWeeklyReport,
  getMonthlyReport,
  getServiceStats,
  updateServiceStatus,
} from "../controllers/timeLogController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ==================== ASSIGNMENTS ====================
router.get("/assignments", getMyAssignments);
router.get("/assignments/:assignmentId", getAssignmentById);

// ==================== TIME LOGS ====================
router.post("/time-logs", createTimeLog);
router.get("/time-logs", getMyTimeLogs);
router.put("/time-logs/:timeLogId", updateTimeLog);
router.delete("/time-logs/:timeLogId", deleteTimeLog);

// ==================== REPORTS ====================
router.get("/reports/weekly", getWeeklyReport);
router.get("/reports/monthly", getMonthlyReport);

// ==================== SERVICE MANAGEMENT ====================
router.get("/services/:service_id/stats", getServiceStats);
router.patch("/services/:service_id/status", updateServiceStatus);

export default router;
