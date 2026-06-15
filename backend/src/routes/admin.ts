import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

router.use(requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/staff/pending', adminController.getPendingStaff);
router.get('/staff', adminController.getAllStaff);
router.post('/staff/:staffId/approve', adminController.approveStaff);
router.delete('/staff/:staffId', adminController.rejectStaff);
router.get('/complaints', adminController.getAllComplaints);
router.delete('/complaints/:complaintId', adminController.deleteComplaint);
router.patch('/complaints/:complaintId/status', adminController.updateComplaintStatus);
router.get('/flag-requests', adminController.getFlagRequests);
router.patch('/flag-requests/:requestId', adminController.reviewFlagRequest);
router.get('/screened-out', adminController.getScreenedOut);
router.get('/officials', adminController.getOfficials);
router.patch('/officials/:officialId', adminController.updateOfficial);
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
