import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateCaseNumber } from '../utils/caseNumber.js';
import { geocodeAndGetDistricts } from './geocodingService.js';
import { sendComplaintNotifications, sendDisputeNotification, sendAutoResolvedNotification } from './emailService.js';
import { env } from '../utils/env.js';
import { scoreUrgency, screenComplaint } from './aiService.js';

const VERIFICATION_DAYS = 7;      // days before pending_verification auto-closes
const DUPLICATE_WINDOW_DAYS = 60; // days to look back for duplicate resolved complaints

interface SubmitComplaintInput {
  userId: string;
  complaintTypeId: string;
  address: string;
  title: string;
  description: string;
  severity?: string;  // optional — kept for API compat; not used in priority system
  isPublic: boolean;
}

// ── Priority recalculation ─────────────────────────────────────────────────
// Distributes priority labels across all open complaints by percentile rank:
//   Top 20%  → critical
//   Next 20% → high
//   Next 30% → moderate
//   Bottom 30% → routine
// Complaints with no urgency_score are treated as bottom of the pool.
export async function recalculatePriorities(): Promise<void> {
  const open = await prisma.complaint.findMany({
    where: { status: { notIn: ['resolved', 'closed', 'rejected'] } },
    orderBy: [{ urgency_score: 'desc' }, { created_at: 'asc' }],
    select: { id: true, urgency_score: true },
  });

  const n = open.length;
  if (n === 0) return;

  const updates: Array<{ id: string; priority: string }> = open.map((c, i) => {
    const pct = i / n;
    let priority: string;
    if (pct < 0.2) priority = 'critical';
    else if (pct < 0.4) priority = 'high';
    else if (pct < 0.7) priority = 'moderate';
    else priority = 'routine';
    return { id: c.id, priority };
  });

  // Group by priority to minimise DB round-trips
  const byPriority: Record<string, string[]> = {};
  for (const { id, priority } of updates) {
    (byPriority[priority] ??= []).push(id);
  }
  await Promise.all(
    Object.entries(byPriority).map(([priority, ids]) =>
      prisma.complaint.updateMany({ where: { id: { in: ids } }, data: { priority } }),
    ),
  );
}

// ── Status log helper ──────────────────────────────────────────────────────
async function logStatusChange(
  complaintId: string,
  fromStatus: string,
  toStatus: string,
  actorId: string,
  actorName: string,
  actorType: 'resident' | 'staff' | 'admin' | 'official' | 'system',
  note?: string,
) {
  await prisma.complaintStatusLog.create({
    data: {
      complaint_id: complaintId,
      changed_by: actorId,
      changed_by_name: actorName,
      changed_by_type: actorType,
      from_status: fromStatus,
      to_status: toStatus,
      note,
    },
  });
}

// ── Submit complaint ───────────────────────────────────────────────────────
export async function submitComplaint(input: SubmitComplaintInput) {
  const { userId, complaintTypeId, address, title, description, isPublic } = input;

  const complaintType = await prisma.complaintType.findUnique({ where: { id: complaintTypeId } });
  if (!complaintType) throw new AppError(400, 'Invalid complaint type');

  // ── AI Screening ── block out-of-scope complaints before saving anything
  const screen = await screenComplaint(title, description, complaintType.name);
  if (!screen.allowed) {
    // Store for admin review (never posted publicly)
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    await prisma.rejectedSubmission.create({
      data: {
        title,
        description,
        complaint_type: complaintType.name,
        address,
        submitter_email: user?.email ?? 'unknown',
        rejection_reason: screen.reason ?? 'Out of scope',
        rejection_category: screen.category ?? 'other_out_of_scope',
        ai_reasoning: screen.reasoning,
      },
    }).catch(() => {}); // fire-and-forget; don't fail submission if this fails
    throw new AppError(422, screen.reason ?? 'This complaint does not fall within the scope of this platform.', {
      category: screen.category,
      guidance: screen.guidance,
    });
  }

  const { address: geo, districts } = await geocodeAndGetDistricts(address);

  let addressRecord = await prisma.address.findUnique({
    where: {
      street_address_city_state_zip_code: {
        street_address: geo.street_address,
        city: geo.city,
        state: geo.state,
        zip_code: geo.zip_code,
      },
    },
  });

  if (!addressRecord) {
    addressRecord = await prisma.address.create({
      data: {
        street_address: geo.street_address,
        city: geo.city,
        state: geo.state,
        zip_code: geo.zip_code,
        latitude: geo.latitude,
        longitude: geo.longitude,
        city_council_district: districts.city_council_district,
        state_house_district: districts.state_house_district,
        state_senate_district: districts.state_senate_district,
      },
    });
  }

  // ── Duplicate detection ──────────────────────────────────────────────────
  const windowStart = new Date(Date.now() - DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const existingResolved = await prisma.complaint.findFirst({
    where: {
      address_id: addressRecord.id,
      complaint_type_id: complaintTypeId,
      status: { in: ['resolved', 'pending_verification'] },
      resolved_at: { gte: windowStart },
      user_id: { not: userId },
    },
    orderBy: { resolved_at: 'desc' },
  });

  if (existingResolved) {
    await prisma.complaint.update({
      where: { id: existingResolved.id },
      data: {
        status: 'in_progress',
        resolved_at: null,
        verification_deadline: null,
        dispute_count: { increment: 1 },
      },
    });
    await prisma.complaintUpdate.create({
      data: {
        complaint_id: existingResolved.id,
        user_id: userId,
        update_type: 'info',
        message: `A different resident reported the same issue at this address — complaint automatically reopened. The fix has been independently disputed.`,
        visibility: 'public',
      },
    });
    await logStatusChange(
      existingResolved.id,
      existingResolved.status,
      'in_progress',
      userId,
      'system (duplicate report)',
      'system',
      'Reopened by independent resident report',
    );
    return {
      id: existingResolved.id,
      case_number: existingResolved.case_number,
      status: 'in_progress',
      title: existingResolved.title,
      tracking_url: `${env.FRONTEND_URL}/track/${existingResolved.case_number}`,
      assigned_department: existingResolved.assigned_department,
      officials_notified: 0,
      created_at: existingResolved.created_at,
      reopened: true,
    };
  }
  // ────────────────────────────────────────────────────────────────────────

  let caseNumber: string;
  let attempts = 0;
  do {
    caseNumber = generateCaseNumber();
    const exists = await prisma.complaint.findUnique({ where: { case_number: caseNumber } });
    if (!exists) break;
    attempts++;
  } while (attempts < 5);

  const trackingUrl = `${env.FRONTEND_URL}/track/${caseNumber}`;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  const complaint = await prisma.complaint.create({
    data: {
      user_id: userId,
      complaint_type_id: complaintTypeId,
      address_id: addressRecord.id,
      title,
      description,
      severity: 'pending',       // legacy field — AI priority replaces self-reported severity
      status: 'submitted',
      assigned_department: complaintType.primary_department,
      case_number: caseNumber!,
      public_tracking_url: trackingUrl,
      is_public: isPublic,
      dept_notified_at: new Date(),
      reps_notified_at: new Date(),
    },
    include: { complaint_type: true, address: true },
  });

  // Log initial submitted status
  await logStatusChange(complaint.id, '', 'submitted', userId, user.email, 'resident');

  await prisma.complaintUpdate.create({
    data: {
      complaint_id: complaint.id,
      user_id: userId,
      update_type: 'submitted',
      message: `Complaint submitted and routed to ${complaintType.primary_department}. Elected officials have been notified.`,
      visibility: 'public',
    },
  });

  // ── AI urgency scoring (fire-and-forget style — don't block response) ──
  scoreUrgency(title, description, complaintType.name)
    .then(async ({ score }) => {
      await prisma.complaint.update({
        where: { id: complaint.id },
        data: { urgency_score: score },
      });
      await recalculatePriorities();
    })
    .catch(() => {}); // scoring failure never blocks submission

  const fullAddress = `${geo.street_address}, ${geo.city}, ${geo.state} ${geo.zip_code}`;
  sendComplaintNotifications({
    caseNumber: caseNumber!,
    complaintTitle: title,
    complaintType: complaintType.name,
    description,
    address: fullAddress,
    severity: 'pending',
    submittedBy: user.email,
    trackingUrl,
    department: complaintType.primary_department,
    departmentEmail: complaintType.department_email,
    officials: districts.officials,
  });

  return {
    id: complaint.id,
    case_number: complaint.case_number,
    status: complaint.status,
    title: complaint.title,
    tracking_url: trackingUrl,
    assigned_department: complaint.assigned_department,
    officials_notified: districts.officials.length,
    created_at: complaint.created_at,
    reopened: false,
  };
}

/** Auto-advance pending_verification past its deadline to resolved. */
async function maybeAutoResolve(complaintId: string) {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: { complaint_type: { select: { name: true } } },
  });
  if (
    complaint?.status === 'pending_verification' &&
    complaint.verification_deadline &&
    new Date() > complaint.verification_deadline
  ) {
    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'resolved',
        resolved_at: new Date(),
        resolved_by_type: 'auto',
        resolved_by_user_id: null,
      },
    });
    await prisma.complaintUpdate.create({
      data: {
        complaint_id: complaintId,
        user_id: complaint.user_id,
        update_type: 'resolved',
        message: 'Complaint automatically verified as resolved. No dispute was filed within the 7-day verification window.',
        visibility: 'public',
      },
    });
    await logStatusChange(
      complaintId,
      'pending_verification',
      'resolved',
      'system',
      'Auto-resolve (7-day window expired)',
      'system',
    );

    const user = await prisma.user.findUnique({
      where: { id: complaint.user_id },
      select: { name: true, email: true },
    });
    if (user?.email) {
      sendAutoResolvedNotification({
        residentName: user.name,
        residentEmail: user.email,
        caseNumber: complaint.case_number,
        complaintTitle: complaint.title,
        trackingUrl: `${env.FRONTEND_URL}/track/${complaint.case_number}`,
      });
    }

    // Recalculate priorities since pool shrank
    recalculatePriorities().catch(() => {});
  }
}

/** Bulk-resolve all overdue pending_verification complaints. Called by cron. */
export async function bulkAutoResolve(): Promise<{ resolved: number }> {
  const overdue = await prisma.complaint.findMany({
    where: {
      status: 'pending_verification',
      verification_deadline: { lt: new Date() },
    },
    select: { id: true },
  });
  for (const { id } of overdue) {
    await maybeAutoResolve(id);
  }
  // Single recalculation after batch (maybeAutoResolve already calls it per complaint,
  // but call once more as a safety net after all are done)
  if (overdue.length > 0) await recalculatePriorities().catch(() => {});
  return { resolved: overdue.length };
}

export async function getComplaintByCase(caseNumber: string, requestingUserId?: string) {
  const found = await prisma.complaint.findUnique({ where: { case_number: caseNumber } });
  if (found) await maybeAutoResolve(found.id);

  const complaint = await prisma.complaint.findUnique({
    where: { case_number: caseNumber },
    include: {
      complaint_type: true,
      address: true,
      updates: { orderBy: { created_at: 'asc' } },
      status_logs: { orderBy: { created_at: 'asc' } },
      user: { select: { name: true } },
    },
  });

  if (!complaint) throw new AppError(404, `No complaint found with case number ${caseNumber}`);
  if (!complaint.is_public) throw new AppError(403, 'This complaint is private');

  return {
    ...complaint,
    is_owner: requestingUserId ? complaint.user_id === requestingUserId : false,
    can_dispute:
      requestingUserId === complaint.user_id &&
      complaint.status === 'pending_verification' &&
      complaint.dispute_count === 0 &&
      complaint.verification_deadline != null &&
      new Date() < complaint.verification_deadline,
  };
}

export async function disputeResolution(complaintId: string, userId: string) {
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) throw new AppError(404, 'Complaint not found');
  if (complaint.user_id !== userId) throw new AppError(403, 'Only the original reporter can dispute');
  if (complaint.status !== 'pending_verification') throw new AppError(400, 'Complaint is not pending verification');
  if (complaint.dispute_count > 0) throw new AppError(400, 'You have already disputed this complaint');
  if (!complaint.verification_deadline || new Date() > complaint.verification_deadline) {
    throw new AppError(400, 'The verification window has closed — the complaint has already been auto-resolved');
  }

  await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status: 'in_progress',
      resolved_at: null,
      verification_deadline: null,
      dispute_count: { increment: 1 },
    },
  });

  await prisma.complaintUpdate.create({
    data: {
      complaint_id: complaintId,
      user_id: userId,
      update_type: 'info',
      message: 'The original reporter disputed this resolution — the issue has NOT been fixed. Complaint reopened for further action.',
      visibility: 'public',
    },
  });

  await logStatusChange(
    complaintId,
    'pending_verification',
    'in_progress',
    userId,
    'Resident (dispute)',
    'resident',
    'Resident disputed resolution',
  );

  const fullComplaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      address: true,
      complaint_type: { select: { name: true } },
    },
  });

  if (fullComplaint?.address) {
    const addr = fullComplaint.address;
    const officials = await prisma.electedOfficial.findMany({
      where: {
        city: 'Philadelphia',
        OR: [
          { title: 'city_council', district: addr.city_council_district ?? -1 },
          { title: 'state_house',  district: addr.state_house_district  ?? -1 },
          { title: 'state_senate', district: addr.state_senate_district ?? -1 },
        ],
      },
      select: { id: true },
    });

    if (officials.length > 0) {
      const officialIds = officials.map((o) => o.id);
      const staffAccounts = await prisma.staffAccount.findMany({
        where: { official_id: { in: officialIds }, email_verified: true },
        include: { user: { select: { name: true, email: true } } },
      });

      const trackingUrl = `${env.FRONTEND_URL}/track/${fullComplaint.case_number}`;
      for (const staff of staffAccounts) {
        sendDisputeNotification({
          staffName: staff.user.name,
          staffEmail: staff.user.email,
          caseNumber: fullComplaint.case_number,
          complaintTitle: fullComplaint.title,
          complaintType: fullComplaint.complaint_type.name,
          address: `${addr.street_address}, ${addr.city}, ${addr.state}`,
          trackingUrl,
        });
      }
    }
  }

  return { message: 'Dispute filed. Complaint has been reopened.' };
}

export async function getUserComplaints(userId: string) {
  return prisma.complaint.findMany({
    where: { user_id: userId },
    include: {
      complaint_type: { select: { name: true, icon_emoji: true } },
      address: { select: { street_address: true, city: true } },
      updates: { orderBy: { created_at: 'desc' }, take: 1 },
    },
    orderBy: { created_at: 'desc' },
  });
}

export async function getComplaintTypes() {
  return prisma.complaintType.findMany({ orderBy: { name: 'asc' } });
}
