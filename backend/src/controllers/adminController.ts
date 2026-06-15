import { Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import * as adminService from '../services/adminService.js';
import { prisma } from '../utils/prisma.js';
import * as auditService from '../services/auditService.js';
import { recalculatePriorities } from '../services/complaintsService.js';

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
  const result = await adminService.approveStaff(staffId, req.user?.userId, req.user?.email);
  res.json(result);
}

export async function rejectStaff(req: AuthRequest, res: Response) {
  const { staffId } = req.params;
  const result = await adminService.rejectStaff(staffId, req.user?.userId, req.user?.email);
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
  const result = await adminService.updateOfficial(officialId, parsed.data, req.user?.userId, req.user?.email);
  res.json(result);
}

export async function getAuditLogs(req: AuthRequest, res: Response) {
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const offset = parseInt(req.query.offset as string) || 0;
  const result = await adminService.getAuditLogs(limit, offset);
  res.json(result);
}

const deleteComplaintSchema = z.object({
  reason: z.string().min(10, 'Please provide a reason of at least 10 characters'),
});

export async function deleteComplaint(req: AuthRequest, res: Response) {
  const { complaintId } = req.params;
  const parsed = deleteComplaintSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: { user: { select: { email: true } } },
  });
  if (!complaint) throw new AppError(404, 'Complaint not found');

  // Log BEFORE deleting — this record must survive the deletion
  await auditService.logAdminAction({
    adminId: req.user?.userId ?? 'unknown',
    adminName: req.user?.email ?? 'unknown',
    action: 'complaint_deleted',
    entityId: complaintId,
    details: {
      case_number: complaint.case_number,
      title: complaint.title,
      description_excerpt: complaint.description.slice(0, 200),
      submitted_at: complaint.created_at.toISOString(),
      submitter_email: complaint.user.email,
      reason: parsed.data.reason,
    },
  });

  await prisma.complaint.delete({ where: { id: complaintId } });
  recalculatePriorities().catch(() => {});

  res.json({ message: 'Complaint deleted and audit record created.' });
}

const updateStatusSchema = z.object({
  status: z.enum(['submitted', 'assigned', 'in_progress', 'pending_verification', 'resolved', 'closed']),
  note: z.string().optional(),
});

export async function updateComplaintStatus(req: AuthRequest, res: Response) {
  const { complaintId } = req.params;
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));

  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) throw new AppError(404, 'Complaint not found');

  const { status, note } = parsed.data;
  const isResolution = ['resolved', 'closed'].includes(status);

  await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status,
      ...(isResolution && { resolved_at: new Date(), resolved_by_type: 'admin', resolved_by_user_id: req.user?.userId }),
    },
  });

  await prisma.complaintStatusLog.create({
    data: {
      complaint_id: complaintId,
      changed_by: req.user?.userId ?? 'unknown',
      changed_by_name: req.user?.email ?? 'unknown',
      changed_by_type: 'admin',
      from_status: complaint.status,
      to_status: status,
      note,
    },
  });

  await auditService.logAdminAction({
    adminId: req.user?.userId ?? 'unknown',
    adminName: req.user?.email ?? 'unknown',
    action: 'status_overridden',
    entityId: complaintId,
    details: { case_number: complaint.case_number, from: complaint.status, to: status, note },
  });

  if (isResolution) recalculatePriorities().catch(() => {});

  res.json({ message: 'Status updated.', status });
}

export async function getFlagRequests(req: AuthRequest, res: Response) {
  const status = typeof req.query.status === 'string' ? req.query.status : 'pending';
  const flags = await prisma.officialFlagRequest.findMany({
    where: { status },
    include: {
      complaint: { select: { case_number: true, title: true, status: true } },
      official: { select: { name: true, title: true } },
    },
    orderBy: { requested_at: 'desc' },
  });
  res.json(flags);
}

const reviewFlagSchema = z.object({
  status: z.enum(['approved', 'denied']),
});

export async function reviewFlagRequest(req: AuthRequest, res: Response) {
  const { requestId } = req.params;
  const parsed = reviewFlagSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));

  const flag = await prisma.officialFlagRequest.findUnique({ where: { id: requestId } });
  if (!flag) throw new AppError(404, 'Flag request not found');

  await prisma.officialFlagRequest.update({
    where: { id: requestId },
    data: { status: parsed.data.status, reviewed_at: new Date() },
  });

  res.json({ message: `Flag request ${parsed.data.status}.` });
}

export async function getScreenedOut(req: AuthRequest, res: Response) {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;
  const items = await prisma.rejectedSubmission.findMany({
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset,
  });
  const total = await prisma.rejectedSubmission.count();
  res.json({ items, total });
}
