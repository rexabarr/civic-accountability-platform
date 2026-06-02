import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listPendingStaff() {
  return prisma.staffAccount.findMany({
    where: { email_verified: false },
    include: { user: { select: { id: true, name: true, email: true, created_at: true } }, official: { select: { name: true, title: true } } },
    orderBy: { created_at: 'desc' },
  });
}

export async function approveStaff(staffId: string) {
  const staff = await prisma.staffAccount.findUnique({ where: { id: staffId } });
  if (!staff) throw new AppError(404, 'Staff account not found');
  return prisma.staffAccount.update({
    where: { id: staffId },
    data: { email_verified: true },
    include: { user: { select: { name: true, email: true } } },
  });
}

export async function rejectStaff(staffId: string) {
  const staff = await prisma.staffAccount.findUnique({
    where: { id: staffId },
    include: { user: true },
  });
  if (!staff) throw new AppError(404, 'Staff account not found');
  await prisma.staffAccount.delete({ where: { id: staffId } });
  await prisma.user.delete({ where: { id: staff.user_id } });
  return { message: 'Staff account rejected and removed' };
}

export async function listAllStaff() {
  return prisma.staffAccount.findMany({
    include: { user: { select: { id: true, name: true, email: true, created_at: true } }, official: { select: { name: true, title: true } } },
    orderBy: { created_at: 'desc' },
  });
}

export async function listAllComplaints(status?: string, limit = 50, offset = 0) {
  const where = status ? { status } : {};
  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      include: {
        complaint_type: { select: { name: true, icon_emoji: true } },
        address: { select: { street_address: true, city: true } },
        user: { select: { name: true, email: true } },
        updates: { orderBy: { created_at: 'desc' }, take: 1 },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.complaint.count({ where }),
  ]);
  return { complaints, total, limit, offset };
}

export async function listOfficials() {
  return prisma.electedOfficial.findMany({
    orderBy: [{ title: 'asc' }, { district: 'asc' }],
  });
}

export async function updateOfficial(
  id: string,
  data: {
    name?: string;
    email?: string;
    office_phone?: string;
    office_address?: string;
    website?: string;
  },
) {
  const official = await prisma.electedOfficial.findUnique({ where: { id } });
  if (!official) throw new AppError(404, 'Official not found');
  return prisma.electedOfficial.update({ where: { id }, data });
}

export async function getDashboardStats() {
  const [
    totalUsers,
    totalComplaints,
    openComplaints,
    resolvedComplaints,
    pendingStaff,
    totalStaff,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.complaint.count(),
    prisma.complaint.count({ where: { status: { in: ['submitted', 'assigned', 'in_progress'] } } }),
    prisma.complaint.count({ where: { status: { in: ['resolved', 'closed'] } } }),
    prisma.staffAccount.count({ where: { email_verified: false } }),
    prisma.staffAccount.count({ where: { email_verified: true } }),
  ]);
  return { totalUsers, totalComplaints, openComplaints, resolvedComplaints, pendingStaff, totalStaff };
}
