import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import * as aiService from '../services/aiService.js';

const router = Router();

const enhanceDescriptionSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

router.post('/enhance-description', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = enhanceDescriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }

  const result = await aiService.enhanceDescription(parsed.data.description);
  res.json(result);
});

export default router;
