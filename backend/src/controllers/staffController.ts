import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import * as staffService from '../services/staffService.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  officialId: z.string().uuid().optional(),
  departmentName: z.string().optional(),
  role: z.string().optional(),
});

const updateSchema = z.object({
  message: z.string().min(5).max(2000),
  updateType: z.enum(['response', 'in_progress', 'resolved', 'closed', 'info']),
  proofImageUrl: z.string().url().optional().or(z.literal('')),
  newStatus: z.enum(['submitted', 'assigned', 'in_progress', 'resolved', 'closed']).optional(),
});

export async function registerStaff(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
  const result = await staffService.registerStaff(
    parsed.data.email,
    parsed.data.password,
    parsed.data.name,
    parsed.data.officialId,
    parsed.data.departmentName,
    parsed.data.role,
  );
  res.status(201).json(result);
}

export async function getMyComplaints(req: AuthRequest, res: Response) {
  const complaints = await staffService.getStaffComplaints(req.user!.userId);
  res.json(complaints);
}

export async function postUpdate(req: AuthRequest, res: Response) {
  const { complaintId } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
  const result = await staffService.postStaffUpdate(
    req.user!.userId,
    complaintId,
    parsed.data.message,
    parsed.data.updateType,
    parsed.data.proofImageUrl || undefined,
    parsed.data.newStatus,
  );
  res.status(201).json(result);
}

export async function getStaffProfile(req: AuthRequest, res: Response) {
  const { prisma } = await import('../utils/prisma.js');
  const staff = await prisma.staffAccount.findUnique({
    where: { user_id: req.user!.userId },
    include: { official: true, user: { select: { name: true, email: true } } },
  });
  if (!staff) throw new AppError(404, 'Staff account not found');
  res.json(staff);
}
