import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as staffController from '../controllers/staffController.js';

const router = Router();

router.post('/auth/register-staff', staffController.registerStaff);
router.get('/staff/profile', requireAuth, staffController.getStaffProfile);
router.get('/staff/complaints', requireAuth, staffController.getMyComplaints);
router.post('/staff/complaints/:complaintId/updates', requireAuth, staffController.postUpdate);

export default router;
