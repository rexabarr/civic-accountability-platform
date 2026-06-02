import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateToken } from '../utils/crypto.js';
import { env } from '../utils/env.js';

const GOV_DOMAINS = ['.gov', '.phila.gov', '.state.pa.us', '.edu']; // .edu for testing

function isGovEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1] ?? '';
  return GOV_DOMAINS.some((d) => domain.endsWith(d));
}

export async function registerStaff(
  email: string,
  password: string,
  name: string,
  officialId?: string,
  departmentName?: string,
  role?: string,
) {
  if (!isGovEmail(email)) {
    throw new AppError(
      400,
      'Staff accounts require a government email address (.gov, .state.pa.us)',
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'Email already registered');

  if (officialId) {
    const official = await prisma.electedOfficial.findUnique({ where: { id: officialId } });
    if (!official) throw new AppError(400, 'Invalid official ID');
  }

  const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const verify_token = generateToken();
  const verify_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email,
      password_hash,
      name,
      user_type: 'rep_staff',
      is_verified: true, // email auto-verified for .gov domains
      verify_token,
      verify_token_expires,
      staff_account: {
        create: {
          official_id: officialId ?? null,
          department_name: departmentName ?? null,
          role: role ?? null,
          email_verified: false, // pending admin approval
          verification_token: generateToken(),
        },
      },
    },
    include: { staff_account: true },
  });

  console.log('\n========================================');
  console.log('🏛️  STAFF REGISTRATION — PENDING APPROVAL');
  console.log(`   Name:       ${name}`);
  console.log(`   Email:      ${email}`);
  console.log(`   Dept:       ${departmentName ?? 'not specified'}`);
  console.log('   Admin must approve at /admin → Staff Accounts');
  console.log('========================================\n');

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    pending_approval: true,
  };
}

export async function getStaffComplaints(userId: string) {
  const staff = await prisma.staffAccount.findUnique({
    where: { user_id: userId },
    include: { official: true },
  });

  if (!staff) throw new AppError(403, 'No staff account found');
  if (!staff.email_verified) {
    throw new AppError(403, 'Your staff account is pending admin approval');
  }

  // If linked to an official, show complaints from their district
  if (staff.official) {
    const districtField: Record<string, string> = {
      city_council: 'city_council_district',
      state_house: 'state_house_district',
      state_senate: 'state_senate_district',
    };
    const field = districtField[staff.official.title];

    return prisma.complaint.findMany({
      where: { address: { [field]: staff.official.district }, is_public: true },
      include: {
        complaint_type: { select: { name: true, icon_emoji: true } },
        address: { select: { street_address: true, city: true, state: true } },
        updates: { orderBy: { created_at: 'desc' }, take: 1 },
        user: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // Dept staff without official: show by department name
  if (staff.department_name) {
    return prisma.complaint.findMany({
      where: { assigned_department: { contains: staff.department_name } },
      include: {
        complaint_type: { select: { name: true, icon_emoji: true } },
        address: { select: { street_address: true, city: true, state: true } },
        updates: { orderBy: { created_at: 'desc' }, take: 1 },
        user: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  return [];
}

export async function postStaffUpdate(
  userId: string,
  complaintId: string,
  message: string,
  updateType: string,
  proofImageUrl?: string,
  newStatus?: string,
) {
  const staff = await prisma.staffAccount.findUnique({ where: { user_id: userId } });
  if (!staff?.email_verified) throw new AppError(403, 'Staff account not approved');

  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) throw new AppError(404, 'Complaint not found');

  const update = await prisma.complaintUpdate.create({
    data: {
      complaint_id: complaintId,
      user_id: userId,
      update_type: updateType,
      message,
      proof_image_url: proofImageUrl ?? null,
      visibility: 'public',
    },
  });

  if (newStatus && newStatus !== complaint.status) {
    // When an official marks something "resolved", it enters a 7-day verification
    // window instead of going directly to resolved. This prevents self-certification.
    const actualStatus = newStatus === 'resolved' ? 'pending_verification' : newStatus;
    const verificationDeadline =
      newStatus === 'resolved'
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : null;

    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: actualStatus,
        resolved_at: newStatus === 'closed' ? new Date() : complaint.resolved_at,
        verification_deadline: verificationDeadline,
      },
    });
  }

  return update;
}
