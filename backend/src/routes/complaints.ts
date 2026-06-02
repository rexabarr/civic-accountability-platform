import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as complaintsController from '../controllers/complaintsController.js';

const router = Router();

// Public
router.get('/complaint-types', complaintsController.listComplaintTypes);
router.get('/track/:caseNumber', complaintsController.trackComplaint);

// Authenticated
router.post('/complaints', requireAuth, complaintsController.submitComplaint);
router.get('/complaints', requireAuth, complaintsController.myComplaints);

export default router;
