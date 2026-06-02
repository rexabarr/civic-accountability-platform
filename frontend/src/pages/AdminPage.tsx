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
} from '../hooks/useAdmin';

type Tab = 'dashboard' | 'staff' | 'complaints' | 'officials';

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

  const TABS: Array<{ id: Tab; label: string; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'staff', label: 'Staff Accounts', badge: pendingStaff?.length },
    { id: 'complaints', label: 'All Complaints' },
    { id: 'officials', label: 'Officials' },
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field max-w-[180px] text-sm"
              >
                <option value="">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              {complaintsData && (
                <span className="text-sm text-gray-500">
                  {complaintsData.total} total · showing {complaintsData.complaints.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {complaintsData?.complaints.map((c: {
                id: string;
                case_number: string;
                title: string;
                status: string;
                severity: string;
                assigned_department: string | null;
                created_at: string;
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
                        {c.assigned_department && ` · Dept: ${c.assigned_department}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        c.status === 'resolved' || c.status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                        c.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{c.status.replace('_', ' ')}</span>
                      <Link
                        to={`/track/${c.case_number}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View public →
                      </Link>
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

        {/* Officials tab */}
        {tab === 'officials' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Edit contact info for elected officials. Changes take effect immediately.
            </p>
            {officials?.map((o) => <OfficialEditor key={o.id} official={o} />)}
          </div>
        )}
      </main>
    </div>
  );
}
