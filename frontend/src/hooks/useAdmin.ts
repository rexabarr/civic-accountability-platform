import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

interface DashboardStats {
  totalUsers: number;
  totalComplaints: number;
  openComplaints: number;
  resolvedComplaints: number;
  pendingStaff: number;
  totalStaff: number;
}

interface StaffAccount {
  id: string;
  email_verified: boolean;
  department_name: string | null;
  role: string | null;
  created_at: string;
  user: { id: string; name: string; email: string; created_at: string };
  official: { name: string; title: string } | null;
}

interface Official {
  id: string;
  name: string;
  title: string;
  district: number;
  email: string | null;
  office_phone: string | null;
  office_address: string | null;
  website: string | null;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<DashboardStats>('/api/admin/dashboard').then((r) => r.data),
    refetchInterval: 30_000,
  });
}

export function usePendingStaff() {
  return useQuery({
    queryKey: ['admin-staff-pending'],
    queryFn: () => api.get<StaffAccount[]>('/api/admin/staff/pending').then((r) => r.data),
  });
}

export function useAllStaff() {
  return useQuery({
    queryKey: ['admin-staff-all'],
    queryFn: () => api.get<StaffAccount[]>('/api/admin/staff').then((r) => r.data),
  });
}

export function useApproveStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) =>
      api.post(`/api/admin/staff/${staffId}/approve`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-staff-pending'] });
      qc.invalidateQueries({ queryKey: ['admin-staff-all'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useRejectStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) =>
      api.delete(`/api/admin/staff/${staffId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-staff-pending'] });
      qc.invalidateQueries({ queryKey: ['admin-staff-all'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useAdminComplaints(status?: string) {
  return useQuery({
    queryKey: ['admin-complaints', status],
    queryFn: () =>
      api
        .get('/api/admin/complaints', { params: status ? { status } : {} })
        .then((r) => r.data),
  });
}

export function useAdminOfficials() {
  return useQuery({
    queryKey: ['admin-officials'],
    queryFn: () => api.get<Official[]>('/api/admin/officials').then((r) => r.data),
  });
}

export function useUpdateOfficial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; email?: string; office_phone?: string; office_address?: string; website?: string }) =>
      api.patch(`/api/admin/officials/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-officials'] });
    },
  });
}

interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  entity_id: string;
  details: string | null;
  created_at: string;
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () =>
      api.get<{ logs: AuditLog[]; total: number }>('/api/admin/audit-logs').then((r) => r.data),
    refetchInterval: 60_000,
  });
}

export function useDeleteComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.delete(`/api/admin/complaints/${id}`, { data: { reason } }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-complaints'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      qc.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });
}

export function useUpdateComplaintStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      api.patch(`/api/admin/complaints/${id}/status`, { status, note }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-complaints'] });
    },
  });
}

interface FlagRequest {
  id: string;
  complaint_id: string;
  official_name: string;
  reason: string;
  details: string | null;
  status: string;
  requested_at: string;
  complaint: { case_number: string; title: string; status: string };
  official: { name: string; title: string };
}

export function useFlagRequests() {
  return useQuery({
    queryKey: ['admin-flag-requests'],
    queryFn: () => api.get<FlagRequest[]>('/api/admin/flag-requests?status=pending').then((r) => r.data),
    refetchInterval: 60_000,
  });
}

export function useReviewFlagRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'denied' }) =>
      api.patch(`/api/admin/flag-requests/${id}`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-flag-requests'] });
    },
  });
}

interface RejectedSubmission {
  id: string;
  title: string;
  description: string;
  complaint_type: string;
  address: string;
  submitter_email: string;
  rejection_reason: string;
  rejection_category: string;
  ai_reasoning: string | null;
  created_at: string;
}

export function useScreenedOut() {
  return useQuery({
    queryKey: ['admin-screened-out'],
    queryFn: () =>
      api.get<{ items: RejectedSubmission[]; total: number }>('/api/admin/screened-out').then((r) => r.data),
  });
}
