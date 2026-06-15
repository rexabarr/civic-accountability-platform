import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useAuth';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';

interface OfficialProfile {
  id: string;
  name: string;
  title: string;
  district: number;
}

interface OfficialComplaint {
  id: string;
  case_number: string;
  title: string;
  status: string;
  priority: string;
  description: string;
  created_at: string;
  flagged_by_me: boolean;
  complaint_type: { name: string; icon_emoji: string | null };
  address: { street_address: string; city: string };
  updates: Array<{ id: string; update_type: string; message: string; created_at: string }>;
}

const FLAG_REASONS = [
  { value: 'wrong_jurisdiction', label: 'Wrong jurisdiction — not my district' },
  { value: 'inaccurate', label: 'Contains inaccurate information about my office' },
  { value: 'personal_matter', label: 'Personal/private matter, not a civic issue' },
  { value: 'harassment', label: 'Harassment or inappropriate content' },
  { value: 'other', label: 'Other' },
];

export default function OfficialDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [respondTarget, setRespondTarget] = useState<OfficialComplaint | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [resolutionCredit, setResolutionCredit] = useState('');
  const [flagTarget, setFlagTarget] = useState<OfficialComplaint | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagDetails, setFlagDetails] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['official-profile'],
    queryFn: () => api.get<OfficialProfile>('/api/official/profile').then((r) => r.data),
  });

  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ['official-complaints', statusFilter],
    queryFn: () =>
      api.get<{ complaints: OfficialComplaint[]; total: number }>(
        '/api/official/complaints',
        { params: statusFilter ? { status: statusFilter } : {} },
      ).then((r) => r.data),
  });

  const respondMutation = useMutation({
    mutationFn: (vars: { id: string; message: string; resolutionCredit?: string }) =>
      api.post(`/api/official/complaints/${vars.id}/respond`, {
        message: vars.message,
        resolutionCredit: vars.resolutionCredit || undefined,
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['official-complaints'] });
      setRespondTarget(null);
      setResponseMessage('');
      setResolutionCredit('');
    },
  });

  const flagMutation = useMutation({
    mutationFn: (vars: { id: string; reason: string; details?: string }) =>
      api.post(`/api/official/complaints/${vars.id}/flag`, {
        reason: vars.reason,
        details: vars.details || undefined,
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['official-complaints'] });
      setFlagTarget(null);
      setFlagReason('');
      setFlagDetails('');
    },
  });

  const TITLE_LABELS: Record<string, string> = {
    city_council: 'City Council',
    state_house: 'State House',
    state_senate: 'State Senate',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Official Portal</h1>
            {profile && (
              <p className="text-blue-300 text-sm">
                {profile.name} · {TITLE_LABELS[profile.title] ?? profile.title} District {profile.district}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-200 hidden sm:block">{user?.name}</span>
            <button onClick={logout} className="btn-secondary text-sm py-1 px-3">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex gap-3 flex-wrap items-center">
          <h2 className="text-lg font-semibold text-gray-800 flex-1">Constituent Complaints</h2>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field max-w-[180px] text-sm">
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_verification">Awaiting Verification</option>
            <option value="resolved">Resolved</option>
          </select>
          {complaintsData && (
            <span className="text-sm text-gray-500">{complaintsData.total} total</span>
          )}
        </div>

        {isLoading && <p className="text-center text-gray-400 py-12">Loading complaints…</p>}

        {complaintsData?.complaints.length === 0 && (
          <p className="text-center text-gray-400 py-12">No complaints in your district matching this filter.</p>
        )}

        <div className="space-y-4">
          {complaintsData?.complaints.map((c) => (
            <div key={c.id} className={`bg-white rounded-xl border p-4 space-y-3 ${c.flagged_by_me ? 'border-amber-200' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{c.complaint_type.icon_emoji ?? '📋'}</span>
                    <span className="text-xs text-gray-400">{c.complaint_type.name}</span>
                    <span className="font-mono text-xs text-gray-300">{c.case_number}</span>
                    {c.flagged_by_me && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Flagged for review</span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">{c.title}</p>
                  <p className="text-sm text-gray-500">{c.address.street_address}, {c.address.city}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority ?? 'pending'} />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap pt-1 border-t border-gray-100">
                <Link to={`/track/${c.case_number}`} className="text-xs text-blue-600 hover:underline">
                  View public page →
                </Link>
                <button
                  onClick={() => setRespondTarget(c)}
                  className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1 rounded-full font-medium"
                >
                  Post response
                </button>
                {!c.flagged_by_me && (
                  <button
                    onClick={() => setFlagTarget(c)}
                    className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1 rounded-full font-medium"
                  >
                    Flag for review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Respond modal */}
      {respondTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Post Response</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-mono text-xs text-gray-400 mb-1">{respondTarget.case_number}</p>
              <p className="font-semibold text-gray-800">{respondTarget.title}</p>
            </div>
            <div>
              <label className="form-label">Your response (public)</label>
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={4}
                className="input-field resize-none"
                placeholder="Describe actions being taken, who you've contacted, expected timeline…"
              />
            </div>
            <div>
              <label className="form-label">Resolution credit (optional)</label>
              <input
                type="text"
                value={resolutionCredit}
                onChange={(e) => setResolutionCredit(e.target.value)}
                className="input-field"
                placeholder="e.g. Coordinated DPW response, referred to Streets Dept…"
              />
              <p className="text-xs text-gray-400 mt-1">Shown on the complaint page if this leads to resolution.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setRespondTarget(null); setResponseMessage(''); setResolutionCredit(''); }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => respondMutation.mutate({ id: respondTarget.id, message: responseMessage, resolutionCredit })}
                disabled={responseMessage.length < 10 || respondMutation.isPending}
                className="btn-primary flex-1"
              >
                {respondMutation.isPending ? 'Posting…' : 'Post Response'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag modal */}
      {flagTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Flag for Admin Review</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-mono text-xs text-gray-400 mb-1">{flagTarget.case_number}</p>
              <p className="font-semibold text-gray-800">{flagTarget.title}</p>
            </div>
            <p className="text-sm text-gray-500">This sends a request to the admin team to review this complaint. It will not be removed unless the admin decides to delete it.</p>
            <div>
              <label className="form-label">Reason</label>
              <select value={flagReason} onChange={(e) => setFlagReason(e.target.value)} className="input-field">
                <option value="">Select a reason…</option>
                {FLAG_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Additional details (optional)</label>
              <textarea value={flagDetails} onChange={(e) => setFlagDetails(e.target.value)} rows={2} className="input-field resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setFlagTarget(null); setFlagReason(''); setFlagDetails(''); }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => flagMutation.mutate({ id: flagTarget.id, reason: flagReason, details: flagDetails })}
                disabled={!flagReason || flagMutation.isPending}
                className="flex-1 bg-amber-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-amber-700 disabled:opacity-50"
              >
                {flagMutation.isPending ? 'Flagging…' : 'Submit Flag Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
