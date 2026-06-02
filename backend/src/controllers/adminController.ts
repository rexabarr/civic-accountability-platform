import { Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import * as adminService from '../services/adminService.js';

export async function getDashboard(_req: AuthRequest, res: Response) {
  const stats = await adminService.getDashboardStats();
  res.json(stats);
}

export async function getPendingStaff(_req: AuthRequest, res: Response) {
  const staff = await adminService.listPendingStaff();
  res.json(staff);
}

export async function getAllStaff(_req: AuthRequest, res: Response) {
  const staff = await adminService.listAllStaff();
  res.json(staff);
}

export async function approveStaff(req: AuthRequest, res: Response) {
  const { staffId } = req.params;
  const result = await adminService.approveStaff(staffId);
  res.json(result);
}

export async function rejectStaff(req: AuthRequest, res: Response) {
  const { staffId } = req.params;
  const result = await adminService.rejectStaff(staffId);
  res.json(result);
}

export async function getAllComplaints(req: AuthRequest, res: Response) {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;
  const result = await adminService.listAllComplaints(status, limit, offset);
  res.json(result);
}

export async function getOfficials(_req: AuthRequest, res: Response) {
  const officials = await adminService.listOfficials();
  res.json(officials);
}

const updateOfficialSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  office_phone: z.string().optional(),
  office_address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
});

export async function updateOfficial(req: AuthRequest, res: Response) {
  const { officialId } = req.params;
  const parsed = updateOfficialSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
  const result = await adminService.updateOfficial(officialId, parsed.data);
  res.json(result);
}
