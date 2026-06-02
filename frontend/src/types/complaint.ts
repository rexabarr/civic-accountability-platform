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
  severity: string;
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
  complaint_type: { name: string; icon_emoji: string | null };
  address: { street_address: string; city: string; state: string; zip_code: string };
  updates: ComplaintUpdate[];
  user?: { name: string };
}

export interface ComplaintUpdate {
  id: string;
  update_type: string;
  message: string;
  visibility: string;
  created_at: string;
}

export type Severity = 'low' | 'moderate' | 'high' | 'critical';

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  critical: 'Critical',
};

export const SEVERITY_COLORS: Record<Severity, string> = {
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
