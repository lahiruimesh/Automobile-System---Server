import express from 'express';
import {
  getMyAvailability,
  setAvailability,
  getScheduledServices,
  deleteAvailability
} from '../controllers/calendarController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/availability', getMyAvailability);
router.post('/availability', setAvailability);
router.delete('/availability/:date', deleteAvailability);
router.get('/scheduled-services', getScheduledServices);

export default router;
