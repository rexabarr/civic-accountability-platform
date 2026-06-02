import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { verifyAccessToken } from '../utils/jwt.js';
import * as complaintsService from '../services/complaintsService.js';

const submitSchema = z.object({
  complaintTypeId: z.string().uuid('Invalid complaint type'),
  address: z.string().min(5, 'Address is required'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  severity: z.enum(['low', 'moderate', 'high', 'critical']).default('moderate'),
  isPublic: z.boolean().default(true),
});

export async function submitComplaint(req: AuthRequest, res: Response) {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }
  const result = await complaintsService.submitComplaint({
    userId: req.user!.userId,
    ...parsed.data,
  });
  res.status(201).json(result);
}

export async function trackComplaint(req: Request, res: Response) {
  const { caseNumber } = req.params;
  if (!caseNumber) throw new AppError(400, 'Case number required');

  // Auth is optional on this public route — if a token is present, pass the userId
  // so the service can set is_owner / can_dispute flags
  let requestingUserId: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(authHeader.slice(7));
      requestingUserId = payload.userId;
    } catch {
      // ignore invalid token on public route
    }
  }

  const complaint = await complaintsService.getComplaintByCase(
    caseNumber.toUpperCase(),
    requestingUserId,
  );
  res.json(complaint);
}

export async function disputeComplaint(req: AuthRequest, res: Response) {
  const { complaintId } = req.params;
  const result = await complaintsService.disputeResolution(complaintId, req.user!.userId);
  res.json(result);
}

export async function myComplaints(req: AuthRequest, res: Response) {
  const complaints = await complaintsService.getUserComplaints(req.user!.userId);
  res.json(complaints);
}

export async function listComplaintTypes(_req: Request, res: Response) {
  const types = await complaintsService.getComplaintTypes();
  res.json(types);
}
