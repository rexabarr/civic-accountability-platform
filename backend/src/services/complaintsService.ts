import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateCaseNumber } from '../utils/caseNumber.js';
import { geocodeAndGetDistricts } from './geocodingService.js';
import { sendComplaintNotifications } from './emailService.js';
import { env } from '../utils/env.js';

const VERIFICATION_DAYS = 7;      // days before pending_verification auto-closes
const DUPLICATE_WINDOW_DAYS = 60; // days to look back for duplicate resolved complaints

interface SubmitComplaintInput {
  userId: string;
  complaintTypeId: string;
  address: string;
  title: string;
  description: string;
  severity: string;
  isPublic: boolean;
}

export async function submitComplaint(input: SubmitComplaintInput) {
  const { userId, complaintTypeId, address, title, description, severity, isPublic } = input;

  const complaintType = await prisma.complaintType.findUnique({ where: { id: complaintTypeId } });
  if (!complaintType) throw new AppError(400, 'Invalid complaint type');

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
  // If a DIFFERENT user submits the same type at the same address within
  // DUPLICATE_WINDOW_DAYS of resolution → auto-reopen the old complaint.
  // This is the neutral third-party verification: an independent resident
  // reporting the same issue proves it wasn't actually fixed.
  const windowStart = new Date(Date.now() - DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const existingResolved = await prisma.complaint.findFirst({
    where: {
      address_id: addressRecord.id,
      complaint_type_id: complaintTypeId,
      status: { in: ['resolved', 'pending_verification'] },
      resolved_at: { gte: windowStart },
      user_id: { not: userId }, // only triggers for a DIFFERENT resident
    },
    orderBy: { resolved_at: 'desc' },
  });

  if (existingResolved) {
    // Reopen the old complaint instead of creating a duplicate
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
    return {
      id: existingResolved.id,
      case_number: existingResolved.case_number,
      status: 'in_progress',
      title: existingResolved.title,
      tracking_url: `${env.FRONTEND_URL}/track/${existingResolved.case_number}`,
      assigned_department: existingResolved.assigned_department,
      officials_notified: 0,
      created_at: existingResolved.created_at,
      reopened: true, // flag for the frontend to show a special message
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
      severity,
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

  await prisma.complaintUpdate.create({
    data: {
      complaint_id: complaint.id,
      user_id: userId,
      update_type: 'submitted',
      message: `Complaint submitted and routed to ${complaintType.primary_department}. Elected officials have been notified.`,
      visibility: 'public',
    },
  });

  const fullAddress = `${geo.street_address}, ${geo.city}, ${geo.state} ${geo.zip_code}`;
  sendComplaintNotifications({
    caseNumber: caseNumber!,
    complaintTitle: title,
    complaintType: complaintType.name,
    description,
    address: fullAddress,
    severity,
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
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (
    complaint?.status === 'pending_verification' &&
    complaint.verification_deadline &&
    new Date() > complaint.verification_deadline
  ) {
    await prisma.complaint.update({
      where: { id: complaintId },
      data: { status: 'resolved', resolved_at: new Date() },
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
  }
}

export async function getComplaintByCase(caseNumber: string, requestingUserId?: string) {
  // First auto-advance if deadline passed
  const found = await prisma.complaint.findUnique({ where: { case_number: caseNumber } });
  if (found) await maybeAutoResolve(found.id);

  const complaint = await prisma.complaint.findUnique({
    where: { case_number: caseNumber },
    include: {
      complaint_type: true,
      address: true,
      updates: { orderBy: { created_at: 'asc' } },
      user: { select: { name: true } },
    },
  });

  if (!complaint) throw new AppError(404, `No complaint found with case number ${caseNumber}`);
  if (!complaint.is_public) throw new AppError(403, 'This complaint is private');

  return {
    ...complaint,
    // Tell the frontend whether the requesting user is the owner (for dispute button)
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
