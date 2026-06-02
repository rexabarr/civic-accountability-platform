import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import type { Complaint } from '../types/complaint';

interface StaffProfile {
  id: string;
  official_id: string | null;
  department_name: string | null;
  role: string | null;
  email_verified: boolean;
  user: { name: string; email: string };
  official: { name: string; title: string; district: number } | null;
}

export function useStaffProfile() {
  return useQuery({
    queryKey: ['staff-profile'],
    queryFn: () => api.get<StaffProfile>('/api/staff/profile').then((r) => r.data),
    retry: false,
  });
}

export function useStaffComplaints() {
  return useQuery({
    queryKey: ['staff-complaints'],
    queryFn: () => api.get<Complaint[]>('/api/staff/complaints').then((r) => r.data),
  });
}

interface PostUpdatePayload {
  complaintId: string;
  message: string;
  updateType: string;
  proofImageUrl?: string;
  newStatus?: string;
}

export function usePostStaffUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ complaintId, ...data }: PostUpdatePayload) =>
      api.post(`/api/staff/complaints/${complaintId}/updates`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-complaints'] });
    },
  });
}

interface RegisterStaffPayload {
  email: string;
  password: string;
  name: string;
  officialId?: string;
  departmentName?: string;
  role?: string;
}

export function useRegisterStaff() {
  return useMutation({
    mutationFn: (data: RegisterStaffPayload) =>
      api.post('/api/auth/register-staff', data).then((r) => r.data),
  });
}
