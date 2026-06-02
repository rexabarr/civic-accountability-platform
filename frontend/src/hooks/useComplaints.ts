import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import type { ComplaintType, Complaint } from '../types/complaint';

export function useComplaintTypes() {
  return useQuery({
    queryKey: ['complaint-types'],
    queryFn: () => api.get<ComplaintType[]>('/api/complaint-types').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

interface SubmitPayload {
  complaintTypeId: string;
  address: string;
  title: string;
  description: string;
  severity: string;
  isPublic: boolean;
}

interface SubmitResult {
  id: string;
  case_number: string;
  status: string;
  title: string;
  tracking_url: string;
  assigned_department: string;
  officials_notified: number;
  created_at: string;
}

export function useSubmitComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitPayload) =>
      api.post<SubmitResult>('/api/complaints', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-complaints'] });
    },
  });
}

export function useMyComplaints() {
  return useQuery({
    queryKey: ['my-complaints'],
    queryFn: () => api.get<Complaint[]>('/api/complaints').then((r) => r.data),
  });
}

export function useTrackComplaint(caseNumber: string) {
  return useQuery({
    queryKey: ['complaint', caseNumber],
    queryFn: () =>
      api.get<Complaint>(`/api/track/${caseNumber.toUpperCase()}`).then((r) => r.data),
    enabled: !!caseNumber,
    retry: false,
  });
}

export function useDisputeResolution(caseNumber: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (complaintId: string) =>
      api.post(`/api/complaints/${complaintId}/dispute`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaint', caseNumber] });
      qc.invalidateQueries({ queryKey: ['my-complaints'] });
    },
  });
}
