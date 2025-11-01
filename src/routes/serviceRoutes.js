import express from 'express';
import {
  getServiceDetails,
  uploadServicePhoto,
  deleteServicePhoto,
  addServiceNote,
  updateServiceNote,
  deleteServiceNote,
  addServiceTask,
  toggleTaskCompletion,
  deleteServiceTask
} from '../controllers/serviceDetailsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Service details
router.get('/:id/details', getServiceDetails);

// Photos
router.post('/photos', uploadServicePhoto);
router.delete('/photos/:id', deleteServicePhoto);

// Notes
router.post('/notes', addServiceNote);
router.put('/notes/:id', updateServiceNote);
router.delete('/notes/:id', deleteServiceNote);

// Tasks
router.post('/tasks', addServiceTask);
router.patch('/tasks/:id/toggle', toggleTaskCompletion);
router.delete('/tasks/:id', deleteServiceTask);

export default router;
