import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload, uploadImage } from '../controllers/uploadController.js';

const router = Router();

router.post('/upload', requireAuth, upload.single('image'), uploadImage);

export default router;
