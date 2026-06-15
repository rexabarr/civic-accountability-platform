import { Router, Request, Response } from 'express';
import { bulkAutoResolve, recalculatePriorities } from '../services/complaintsService.js';
import { env } from '../utils/env.js';

const router = Router();

function checkCronSecret(req: Request, res: Response): boolean {
  const secret = req.headers['x-cron-secret'];
  if (env.CRON_SECRET && secret !== env.CRON_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

router.post('/auto-resolve', async (req: Request, res: Response) => {
  if (!checkCronSecret(req, res)) return;
  const result = await bulkAutoResolve();
  res.json({ ok: true, ...result });
});

router.post('/recalculate-priorities', async (req: Request, res: Response) => {
  if (!checkCronSecret(req, res)) return;
  await recalculatePriorities();
  res.json({ ok: true, message: 'Priority labels recalculated.' });
});

export default router;
