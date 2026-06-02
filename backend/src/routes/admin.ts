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
router.get('/officials', adminController.getOfficials);
router.patch('/officials/:officialId', adminController.updateOfficial);

export default router;
