import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { gradeAllOfficials, gradeOneOfficial } from '../services/gradingService.js';

export async function getLeaderboard(_req: Request, res: Response) {
  const results = await gradeAllOfficials();
  res.json(results);
}

export async function getOfficialGrade(req: Request, res: Response) {
  const { officialId } = req.params;
  const result = await gradeOneOfficial(officialId);
  if (!result) throw new AppError(404, 'Official not found');
  res.json(result);
}
