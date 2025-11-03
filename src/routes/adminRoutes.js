import express from "express";
import {
    getPendingEmployees,
    approveEmployee,
    getAllEmployees,
    getTotalEmployeesCount,
    getTotalCustomersCount,
    getTotalAppointmentsCount,
    getTotalCompletedServicesCount,
    addNewEmployee,
    updateEmployee,
    deleteEmployee,
    getAllCustomers,
    getCustomerVehicles,
    getCustomerServiceHistory
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// only admin can access (we'll check role on frontend for now)
router.get("/employees", protect, getPendingEmployees);
router.put("/employees/:id/approve", protect, approveEmployee);
router.get("/employees/all", protect, getAllEmployees);
router.get("/employees/total", protect, getTotalEmployeesCount);
router.get("/customers/total", protect, getTotalCustomersCount);
router.get("/appointments/total", protect, getTotalAppointmentsCount);
router.get("/services/total", protect, getTotalCompletedServicesCount);
router.post("/employees", protect, addNewEmployee);
router.put("/employees/:id", protect, updateEmployee);
router.delete("/employees/:id", protect, deleteEmployee);
router.get("/customers/all", protect, getAllCustomers);
router.get("/customers/:customerId/vehicles", protect, getCustomerVehicles);
router.get("/customers/:customerId/services", protect, getCustomerServiceHistory);

export default router;
