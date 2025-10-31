import express from "express";
import { 
  getPendingEmployees, 
  approveEmployee,
  requestAppointmentModification,
  getModificationRequests,
  approveModificationRequest,
  rejectModificationRequest,
  getMyModificationRequests
} from "../controllers/adminController.js";
import { protect, roleCheck } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin routes
router.get("/employees", protect, roleCheck(["admin"]), getPendingEmployees);
router.put("/employees/:id/approve", protect, roleCheck(["admin"]), approveEmployee);

// Modification request routes
router.post("/appointments/:appointmentId/request-modification", protect, roleCheck(["customer"]), requestAppointmentModification);
router.get("/modifications/my-requests", protect, roleCheck(["customer"]), getMyModificationRequests);
router.get("/modifications", protect, roleCheck(["employee", "admin"]), getModificationRequests);
router.put("/modifications/:modificationId/approve", protect, roleCheck(["employee", "admin"]), approveModificationRequest);
router.put("/modifications/:modificationId/reject", protect, roleCheck(["employee", "admin"]), rejectModificationRequest);

export default router;

