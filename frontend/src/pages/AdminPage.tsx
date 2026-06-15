import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useAuth';
import {
  useAdminStats,
  usePendingStaff,
  useAllStaff,
  useApproveStaff,
  useRejectStaff,
  useAdminComplaints,
  useAdminOfficials,
  useUpdateOfficial,
  useAuditLogs,
  useDeleteComplaint,
  useUpdateComplaintStatus,
  useFlagRequests,
  useReviewFlagRequest,
  useScreenedOut,
} from '../hooks/useAdmin';
import { PriorityBadge } from '../components/StatusBadge';

type Tab = 'dashboard' | 'staff' | 'complaints' | 'officials' | 'audit' | 'flags' | 'screened';

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="card text-center py-4">
      <p className={`text-3xl font-bold ${accent ?? 'text-gray-900'}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function StaffRow({
  staff,
  showActions,
}: {
  staff: {
    id: string;
    email_verified: boolean;
    department_name: string | null;
    role: string | null;
    created_at: string;
    user: { id: string; name: string; email: string; created_at: string };
    official: { name: string; title: string } | null;
  };
  showActions?: boolean;
}) {
  const approve = useApproveStaff();
  const reject = useRejectStaff();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{staff.user.name}</p>
          <p className="text-sm text-gray-500">{staff.user.email}</p>
          {staff.official && (
            <p className="text-xs text-blue-600 mt-0.5">
              Linked to: {staff.official.name} ({staff.official.title})
            </p>
          )}
          {staff.department_name && (
            <p className="text-xs text-gray-400 mt-0.5">
              {staff.department_name}{staff.role ? ` — ${staff.role}` : ''}
            </p>
          )}
          <p className="text-xs text-gray-300 mt-1">
            Registered {format(new Date(staff.user.created_at), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${staff.email_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {staff.email_verified ? 'Approved' : 'Pending'}
          </span>
          {showActions && !staff.email_verified && (
            <>
              <button
                onClick={() => approve.mutate(staff.id)}
                disabled={approve.isPending}
                className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
              >
                Approve
              </button>
              {confirming ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => reject.mutate(staff.id)}
                    disabled={reject.isPending}
                    className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 font-medium"
                  >
                    Confirm reject
                  </button>
                  <button onClick={() => setConfirming(false)} className="text-sm text-gray-500 hover:text-gray-700 px-2">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  className="text-sm text-red-500 hover:text-red-700 font-medium"
                >
                  Reject
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OfficialEditor({
  official,
}: {
  official: {
    id: string;
    name: string;
    title: string;
    district: number;
    email: string | null;
    office_phone: string | null;
    office_address: string | null;
    website: string | null;
  };
}) {
  const update = useUpdateOfficial();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    email: official.email ?? '',
    office_phone: official.office_phone ?? '',
    office_address: official.office_address ?? '',
    website: official.website ?? '',
  });

  const TITLE_LABELS: Record<string, string> = {
    city_council: 'City Council',
    state_house: 'State House',
    state_senate: 'State Senate',
  };

  async function save() {
    await update.mutateAsync({
      id: official.id,
      email: form.email || undefined,
      office_phone: form.office_phone || undefined,
      office_address: form.office_address || undefined,
      website: form.website || undefined,
    });
    setEditing(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{official.name}</p>
          <p className="text-sm text-gray-500">{TITLE_LABELS[official.title] ?? official.title} · District {official.district}</p>
          {!editing && (
            <div className="mt-2 space-y-0.5 text-xs text-gray-400">
              {official.email && <p>✉ {official.email}</p>}
              {official.office_phone && <p>☎ {official.office_phone}</p>}
              {official.office_address && <p>📍 {official.office_address}</p>}
              {official.website && <p>🌐 {official.website}</p>}
            </div>
          )}
          {editing && (
            <div className="mt-3 space-y-2">
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field text-sm"
                placeholder="Email"
              />
              <input
                value={form.office_phone}
                onChange={(e) => setForm({ ...form, office_phone: e.target.value })}
                className="input-field text-sm"
                placeholder="Office phone"
              />
              <input
                value={form.office_address}
                onChange={(e) => setForm({ ...form, office_address: e.target.value })}
                className="input-field text-sm"
                placeholder="Office address"
              />
              <input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="input-field text-sm"
                placeholder="Website URL"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={update.isPending}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {update.isPending ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: stats } = useAdminStats();
  const { data: pendingStaff } = usePendingStaff();
  const { data: allStaff } = useAllStaff();
  const { data: complaintsData } = useAdminComplaints(statusFilter || undefined);
  const { data: officials } = useAdminOfficials();
  const { data: auditData } = useAuditLogs();
  const { data: flagData } = useFlagRequests();
  const { data: screenedData } = useScreenedOut();
  const deleteComplaint = useDeleteComplaint();
  const updateStatus = useUpdateComplaintStatus();
  const reviewFlag = useReviewFlagRequest();

  // Delete complaint state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; case_number: string; title: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  const ACTION_LABELS: Record<string, string> = {
    staff_approved: 'Approved staff',
    staff_rejected: 'Rejected staff',
    official_updated: 'Updated official',
    complaint_deleted: 'Deleted complaint',
    status_overridden: 'Status override',
  };

  const TABS: Array<{ id: Tab; label: string; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'staff', label: 'Staff Accounts', badge: pendingStaff?.length },
    { id: 'complaints', label: 'All Complaints' },
    { id: 'officials', label: 'Officials' },
    { id: 'flags', label: 'Flag Requests', badge: Array.isArray(flagData) ? flagData.length : 0 },
    { id: 'screened', label: 'Screened Out' },
    { id: 'audit', label: 'Audit Log' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <p className="text-blue-300 text-sm">Civic Accountability Platform</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-blue-200 hidden sm:block">{user?.name}</span>
          <Link to="/dashboard" className="btn-secondary text-sm py-1 px-3 text-blue-900">
            Resident View
          </Link>
          <Link to="/admin-settings" className="btn-secondary text-sm py-1 px-3">
            Settings
          </Link>
          <button onClick={logout} className="btn-secondary text-sm py-1 px-3">
            Sign out
          </button>
        </div>
      </header>

      {/* Tab nav */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Dashboard tab */}
        {tab === 'dashboard' && stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="Total Users" value={stats.totalUsers} />
              <StatCard label="Total Complaints" value={stats.totalComplaints} />
              <StatCard label="Open Complaints" value={stats.openComplaints} accent="text-orange-600" />
              <StatCard label="Resolved" value={stats.resolvedComplaints} accent="text-emerald-600" />
              <StatCard label="Pending Staff Approval" value={stats.pendingStaff} accent={stats.pendingStaff > 0 ? 'text-red-600' : 'text-gray-900'} />
              <StatCard label="Active Staff" value={stats.totalStaff} />
            </div>
            {stats.pendingStaff > 0 && (
              <div className="alert-error">
                {stats.pendingStaff} staff account{stats.pendingStaff > 1 ? 's' : ''} pending approval.{' '}
                <button onClick={() => setTab('staff')} className="font-semibold underline">
                  Review now →
                </button>
              </div>
            )}
          </>
        )}

        {/* Staff tab */}
        {tab === 'staff' && (
          <div className="space-y-6">
            {pendingStaff && pendingStaff.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Pending Approval ({pendingStaff.length})
                </h2>
                {pendingStaff.map((s) => <StaffRow key={s.id} staff={s} showActions />)}
              </div>
            )}
            {allStaff && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  All Staff ({allStaff.filter((s) => s.email_verified).length} approved)
                </h2>
                {allStaff.filter((s) => s.email_verified).map((s) => <StaffRow key={s.id} staff={s} />)}
                {allStaff.filter((s) => s.email_verified).length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-8">No approved staff yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Complaints tab */}
        {tab === 'complaints' && (
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap items-center">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field max-w-[180px] text-sm">
                <option value="">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="pending_verification">Awaiting Verification</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              {complaintsData && (
                <span className="text-sm text-gray-500">{complaintsData.total} total · showing {complaintsData.complaints.length}</span>
              )}
            </div>
            <div className="space-y-3">
              {complaintsData?.complaints.map((c: {
                id: string; case_number: string; title: string; status: string;
                priority?: string; assigned_department: string | null; created_at: string;
                complaint_type: { name: string; icon_emoji: string | null };
                address: { street_address: string; city: string };
                user: { name: string; email: string };
                updates: Array<{ id: string; created_at: string }>;
              }) => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start gap-3 flex-wrap justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{c.complaint_type.icon_emoji ?? '📋'}</span>
                        <span className="text-xs text-gray-400">{c.complaint_type.name}</span>
                        <span className="font-mono text-xs text-gray-300">{c.case_number}</span>
                      </div>
                      <p className="font-semibold text-gray-900">{c.title}</p>
                      <p className="text-sm text-gray-500">{c.address.street_address}, {c.address.city}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        By {c.user.name} · {format(new Date(c.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <PriorityBadge priority={c.priority ?? 'pending'} />
                      {/* Status dropdown */}
                      <select
                        defaultValue={c.status}
                        onChange={(e) => {
                          if (e.target.value !== c.status) {
                            updateStatus.mutate({ id: c.id, status: e.target.value });
                          }
                        }}
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="pending_verification">Awaiting Verification</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <div className="flex gap-2 items-center">
                        <Link to={`/track/${c.case_number}`} className="text-xs text-blue-600 hover:underline">View →</Link>
                        <button
                          onClick={() => setDeleteTarget({ id: c.id, case_number: c.case_number, title: c.title })}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {complaintsData?.complaints.length === 0 && (
                <p className="text-center text-gray-400 py-12">No complaints found.</p>
              )}
            </div>
          </div>
        )}

        {/* Flag Requests tab */}
        {tab === 'flags' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Official-flagged complaints awaiting admin review. Approving creates a task for you to investigate — it does not auto-delete.</p>
            {!Array.isArray(flagData) || flagData.length === 0 ? (
              <p className="text-center text-gray-400 py-12">No pending flag requests.</p>
            ) : (
              <div className="space-y-3">
                {flagData.map((f) => (
                  <div key={f.id} className="bg-white rounded-xl border border-amber-200 p-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-semibold text-gray-900">{f.complaint.title}</p>
                        <p className="font-mono text-xs text-gray-400">{f.complaint.case_number}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Flagged by <strong>{f.official_name}</strong> ({f.official.title.replace('_',' ')})
                        </p>
                        <p className="text-sm text-gray-500">
                          Reason: <span className="font-medium">{f.reason.replace('_',' ')}</span>
                          {f.details && ` — "${f.details}"`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{format(new Date(f.requested_at), 'MMM d, yyyy HH:mm')}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => reviewFlag.mutate({ id: f.id, status: 'approved' })}
                          disabled={reviewFlag.isPending}
                          className="text-sm bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-50"
                        >
                          Approve for review
                        </button>
                        <button
                          onClick={() => reviewFlag.mutate({ id: f.id, status: 'denied' })}
                          disabled={reviewFlag.isPending}
                          className="text-sm text-gray-500 hover:text-gray-700 px-2"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Screened Out tab */}
        {tab === 'screened' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Submissions blocked by AI screening. Review for false positives. These were never posted publicly.</p>
            {!screenedData?.items.length ? (
              <p className="text-center text-gray-400 py-12">No screened-out submissions.</p>
            ) : (
              <div className="space-y-3">
                {screenedData.items.map((s) => (
                  <div key={s.id} className="bg-white rounded-xl border border-red-100 p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{s.rejection_category.replace(/_/g,' ')}</span>
                          <span className="text-xs text-gray-400">{s.complaint_type}</span>
                        </div>
                        <p className="font-semibold text-gray-900">{s.title}</p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{s.description}</p>
                        <p className="text-xs text-red-600 mt-1">Reason: {s.rejection_reason}</p>
                        {s.ai_reasoning && <p className="text-xs text-gray-400 mt-0.5">AI: {s.ai_reasoning}</p>}
                        <p className="text-xs text-gray-400 mt-1">{s.submitter_email} · {format(new Date(s.created_at), 'MMM d, yyyy HH:mm')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Officials tab */}
        {tab === 'officials' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Edit contact info for elected officials. Changes take effect immediately.
            </p>
            {officials?.map((o) => <OfficialEditor key={o.id} official={o} />)}
          </div>
        )}

        {/* Audit log tab */}
        {tab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Permanent admin action log — deletions, status overrides, staff approvals. Cannot be deleted.</p>
              {auditData && <span className="text-sm text-gray-400">{auditData.total} total</span>}
            </div>
            {!auditData?.logs.length ? (
              <p className="text-center text-gray-400 py-12">No admin actions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {auditData.logs.map((log) => {
                  let details: Record<string, string> = {};
                  try { details = JSON.parse(log.details ?? '{}'); } catch {}
                  const isDeletion = log.action === 'complaint_deleted';
                  return (
                    <div key={log.id} className={`rounded-lg border p-3 ${isDeletion ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'}`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              isDeletion ? 'bg-red-100 text-red-700' :
                              log.action === 'staff_approved' ? 'bg-emerald-100 text-emerald-700' :
                              log.action === 'staff_rejected' ? 'bg-orange-100 text-orange-700' :
                              log.action === 'status_overridden' ? 'bg-purple-100 text-purple-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {ACTION_LABELS[log.action] ?? log.action}
                            </span>
                            <span className="text-xs text-gray-400">{log.admin_name}</span>
                            <span className="text-xs text-gray-300">{format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}</span>
                          </div>
                          {isDeletion && (
                            <div className="text-xs space-y-0.5 mt-1">
                              <p className="text-gray-700"><strong>{details.case_number}</strong> — {details.title}</p>
                              {details.description_excerpt && <p className="text-gray-500 italic">"{details.description_excerpt}..."</p>}
                              {details.reason && <p className="text-red-700 font-medium">Reason: {details.reason}</p>}
                            </div>
                          )}
                          {log.action === 'status_overridden' && (
                            <p className="text-xs text-gray-500 mt-1">{details.case_number} · {details.from} → {details.to}{details.note ? ` · "${details.note}"` : ''}</p>
                          )}
                          {!isDeletion && log.action !== 'status_overridden' && (
                            <p className="text-xs text-gray-500 mt-1">
                              {details.staffName ?? details.officialName ?? log.entity_id.slice(0, 8)}
                              {details.staffEmail ? ` (${details.staffEmail})` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete complaint modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Delete Complaint</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-mono text-xs text-gray-400 mb-1">{deleteTarget.case_number}</p>
              <p className="font-semibold text-gray-800">{deleteTarget.title}</p>
            </div>
            <div>
              <label className="form-label text-red-700">Reason for deletion <span className="text-red-500">*</span></label>
              <p className="text-xs text-gray-500 mb-2">This reason will be permanently recorded in the audit log and cannot be changed.</p>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="e.g. Duplicate of CAP-2026-XXXXX, Spam/test submission, Out of scope personal matter…"
              />
              {deleteReason.length < 10 && deleteReason.length > 0 && (
                <p className="text-xs text-red-500 mt-1">Must be at least 10 characters.</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setDeleteTarget(null); setDeleteReason(''); }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteReason.length >= 10) {
                    deleteComplaint.mutate(
                      { id: deleteTarget.id, reason: deleteReason },
                      { onSuccess: () => { setDeleteTarget(null); setDeleteReason(''); } },
                    );
                  }
                }}
                disabled={deleteReason.length < 10 || deleteComplaint.isPending}
                className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteComplaint.isPending ? 'Deleting…' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
