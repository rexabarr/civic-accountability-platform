import { Router } from 'express';
import * as leaderboardController from '../controllers/leaderboardController.js';

const router = Router();

router.get('/leaderboard', leaderboardController.getLeaderboard);
router.get('/leaderboard/:officialId', leaderboardController.getOfficialGrade);

export default router;
