import { prisma } from '../utils/prisma.js';

export type AuditAction =
  | 'staff_approved'
  | 'staff_rejected'
  | 'official_updated'
  | 'complaint_deleted'
  | 'status_overridden'
  | 'priority_set';

export async function logAdminAction(params: {
  adminId: string;
  adminName: string;
  action: AuditAction | string;   // string fallback for forward-compat
  entityId: string;
  details?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      admin_id: params.adminId,
      admin_name: params.adminName,
      action: params.action,
      entity_id: params.entityId,
      details: params.details ? JSON.stringify(params.details) : null,
    },
  });
}

export async function getAuditLogs(limit = 100, offset = 0) {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count(),
  ]);
  return { logs, total };
}
