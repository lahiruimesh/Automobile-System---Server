import express from 'express';
import {
  getAvailableParts,
  createPartsRequest,
  getMyPartsRequests,
  getServicePartsRequests
} from '../controllers/partsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/inventory', getAvailableParts);
router.post('/requests', createPartsRequest);
router.get('/requests/my', getMyPartsRequests);
router.get('/requests/service/:serviceId', getServicePartsRequests);

export default router;
