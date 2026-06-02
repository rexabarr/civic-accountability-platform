import { Router } from 'express';
import * as geocodingController from '../controllers/geocodingController.js';

const router = Router();

router.get('/geocode', geocodingController.geocode);
router.get('/districts', geocodingController.getDistricts);

export default router;
