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
