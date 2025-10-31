import express from 'express';
import {
  getMyProfile,
  updateMyProfile,
  updateProfilePicture,
  addSkill,
  deleteSkill,
  addCertification,
  deleteCertification
} from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile routes
router.get('/profile', getMyProfile);
router.put('/profile', updateMyProfile);
router.put('/profile/picture', updateProfilePicture);

// Skills routes
router.post('/skills', addSkill);
router.delete('/skills/:id', deleteSkill);

// Certifications routes
router.post('/certifications', addCertification);
router.delete('/certifications/:id', deleteCertification);

export default router;
