import express from "express";
import { protect, roleCheck } from "../middleware/authMiddleware.js";
import {
  getSlots,
  bookAppointment,
  getMyAppointments,
  cancelUserAppointment,
  getUpcoming,
  updateStatus,
  getMyVehicles,
  addVehicle,
  deleteVehicle,
} from "../controllers/appointmentController.js";

const router = express.Router();

/**
 * Appointment Routes
 * All routes require authentication
 */

// Get available slots (public for authenticated users)
router.get("/slots", protect, getSlots);

// Customer routes
router.post("/", protect, roleCheck(["customer"]), bookAppointment);
router.get("/", protect, roleCheck(["customer"]), getMyAppointments);
router.patch("/:id/cancel", protect, roleCheck(["customer"]), cancelUserAppointment);

// Employee/Admin routes
router.get("/upcoming", protect, roleCheck(["employee", "admin"]), getUpcoming);
router.patch("/:id/status", protect, roleCheck(["employee", "admin"]), updateStatus);

// Vehicle routes
router.get("/vehicles", protect, roleCheck(["customer"]), getMyVehicles);
router.post("/vehicles", protect, roleCheck(["customer"]), addVehicle);
router.delete("/vehicles/:id", protect, roleCheck(["customer"]), deleteVehicle);

export default router;
