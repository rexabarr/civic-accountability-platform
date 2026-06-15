import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../utils/prisma.js';

const router = Router();

// All official routes require authentication with user_type === 'official'
function requireOfficial(req: AuthRequest, res: Response, next: Function) {
  if (!req.user || req.user.userType !== 'official') {
    res.status(403).json({ error: 'Official account required' });
    return;
  }
  next();
}

router.use(requireAuth, requireOfficial);

// GET /api/official/profile — get linked ElectedOfficial record
router.get('/profile', async (req: AuthRequest, res: Response) => {
  const official = await prisma.electedOfficial.findFirst({
    where: { user_id: req.user!.userId },
  });
  if (!official) throw new AppError(404, 'No official record linked to this account');
  res.json(official);
});

// GET /api/official/complaints — complaints from this official's districts
router.get('/complaints', async (req: AuthRequest, res: Response) => {
  const official = await prisma.electedOfficial.findFirst({
    where: { user_id: req.user!.userId },
    include: { flag_requests: { select: { complaint_id: true } } },
  });
  if (!official) throw new AppError(404, 'No official record linked to this account');

  // Find addresses in this official's district
  const districtFilter =
    official.title === 'city_council'
      ? { city_council_district: official.district }
      : official.title === 'state_house'
        ? { state_house_district: official.district }
        : { state_senate_district: official.district };

  const addresses = await prisma.address.findMany({
    where: { city: 'Philadelphia', state: 'PA', ...districtFilter },
    select: { id: true },
  });
  const addressIds = addresses.map((a) => a.id);

  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;

  const flaggedIds = new Set(official.flag_requests.map((f) => f.complaint_id));

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where: {
        address_id: { in: addressIds },
        is_public: true,
        ...(status ? { status } : {}),
      },
      include: {
        complaint_type: { select: { name: true, icon_emoji: true } },
        address: { select: { street_address: true, city: true } },
        updates: { orderBy: { created_at: 'desc' }, take: 1 },
      },
      orderBy: [{ priority: 'asc' }, { created_at: 'desc' }],
      take: limit,
      skip: offset,
    }),
    prisma.complaint.count({
      where: { address_id: { in: addressIds }, is_public: true, ...(status ? { status } : {}) },
    }),
  ]);

  // Annotate with flag status
  const annotated = complaints.map((c) => ({ ...c, flagged_by_me: flaggedIds.has(c.id) }));
  res.json({ complaints: annotated, total });
});

// POST /api/official/complaints/:id/flag — request admin review
const flagSchema = z.object({
  reason: z.enum(['wrong_jurisdiction', 'inaccurate', 'personal_matter', 'harassment', 'other']),
  details: z.string().max(1000).optional(),
});

router.post('/complaints/:complaintId/flag', async (req: AuthRequest, res: Response) => {
  const { complaintId } = req.params;
  const parsed = flagSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));

  const official = await prisma.electedOfficial.findFirst({ where: { user_id: req.user!.userId } });
  if (!official) throw new AppError(404, 'No official record linked to this account');

  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) throw new AppError(404, 'Complaint not found');

  // Check not already flagged by this official
  const existing = await prisma.officialFlagRequest.findFirst({
    where: { complaint_id: complaintId, official_id: official.id, status: 'pending' },
  });
  if (existing) throw new AppError(409, 'You have already flagged this complaint for review');

  await prisma.officialFlagRequest.create({
    data: {
      complaint_id: complaintId,
      official_id: official.id,
      official_name: official.name,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });

  res.status(201).json({ message: 'Complaint flagged for admin review.' });
});

// POST /api/official/complaints/:id/respond — post a public response
const respondSchema = z.object({
  message: z.string().min(10).max(2000),
  resolutionCredit: z.string().max(200).optional(),
});

router.post('/complaints/:complaintId/respond', async (req: AuthRequest, res: Response) => {
  const { complaintId } = req.params;
  const parsed = respondSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));

  const official = await prisma.electedOfficial.findFirst({ where: { user_id: req.user!.userId } });
  if (!official) throw new AppError(404, 'No official record linked to this account');

  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) throw new AppError(404, 'Complaint not found');

  await prisma.complaintUpdate.create({
    data: {
      complaint_id: complaintId,
      user_id: req.user!.userId,
      update_type: 'response',
      message: `[${official.name}, ${official.title.replace('_', ' ')} District ${official.district}]: ${parsed.data.message}`,
      visibility: 'public',
    },
  });

  // Update resolution credit if provided
  if (parsed.data.resolutionCredit) {
    await prisma.complaint.update({
      where: { id: complaintId },
      data: { resolution_credit: parsed.data.resolutionCredit },
    });
  }

  res.status(201).json({ message: 'Response posted.' });
});

export default router;