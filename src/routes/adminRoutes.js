import express from "express";
import { getPendingEmployees, approveEmployee } from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// only admin can access (we'll check role on frontend for now)
router.get("/employees", protect, getPendingEmployees);
router.put("/employees/:id/approve", protect, approveEmployee);

export default router;
