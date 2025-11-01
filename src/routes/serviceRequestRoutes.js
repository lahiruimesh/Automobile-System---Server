import express from "express";
import {
  createServiceRequest,
  getUserRequests,
  getAllRequests,
  updateRequestStatus
} from "../controllers/serviceRequestController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createServiceRequest);
router.get("/", protect, getUserRequests);
router.get("/all", protect, adminOnly, getAllRequests);
router.get("/requests", protect, adminOnly, getAllRequests);
router.put("/:id", protect, adminOnly, updateRequestStatus);

export default router;