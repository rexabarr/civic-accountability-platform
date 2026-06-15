export interface ComplaintType {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon_emoji: string | null;
  primary_department: string;
  department_email: string | null;
  avg_resolution_days: number | null;
}

export interface Complaint {
  id: string;
  case_number: string;
  status: string;
  title: string;
  description: string;
  severity: string;         // legacy field — still in DB, kept for compat
  priority: string;         // AI-assigned: pending/routine/moderate/high/critical
  urgency_score: number | null;
  assigned_department: string | null;
  public_tracking_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  verification_deadline: string | null;
  dispute_count: number;
  is_owner: boolean;
  can_dispute: boolean;
  resolved_by_type: string | null;
  resolution_credit: string | null;
  complaint_type: { name: string; icon_emoji: string | null };
  address: { street_address: string; city: string; state: string; zip_code: string };
  updates: ComplaintUpdate[];
  status_logs?: ComplaintStatusLog[];
  user?: { name: string };
}

export interface ComplaintStatusLog {
  id: string;
  changed_by: string;
  changed_by_name: string;
  changed_by_type: string;
  from_status: string;
  to_status: string;
  note: string | null;
  created_at: string;
}

export interface ComplaintUpdate {
  id: string;
  update_type: string;
  message: string;
  visibility: string;
  created_at: string;
}

// Priority is AI-assigned at submission time, distributed by percentile
export type Priority = 'pending' | 'routine' | 'moderate' | 'high' | 'critical';

export const PRIORITY_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  routine: 'Routine',
  moderate: 'Moderate',
  high: 'High',
  critical: 'Critical',
};

export const PRIORITY_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  routine: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

// Kept for legacy compat (existing severity values in DB)
export type Severity = 'low' | 'moderate' | 'high' | 'critical';
export const SEVERITY_LABELS: Record<string, string> = { low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Critical' };
export const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  pending_verification: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

export const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  pending_verification: 'Awaiting Verification',
  resolved: 'Resolved',
  closed: 'Closed',
};
