import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useAuth';
import { useStaffProfile, useStaffComplaints, usePostStaffUpdate } from '../hooks/useStaff';
import { StatusBadge } from '../components/StatusBadge';
import type { Complaint } from '../types/complaint';
import api from '../utils/api';

const UPDATE_TYPES = [
  { value: 'response', label: 'Official Response' },
  { value: 'in_progress', label: 'Work In Progress' },
  { value: 'info', label: 'Information Update' },
  { value: 'resolved', label: 'Mark Resolved (starts 7-day verification)' },
  { value: 'closed', label: 'Close Complaint (administrative close)' },
] as const;

const STATUSES = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed (administrative)' },
] as const;
// Note: 'resolved' triggers pending_verification automatically — not shown here

const updateSchema = z.object({
  message: z.string().min(5, 'Message must be at least 5 characters').max(2000),
  updateType: z.enum(['response', 'in_progress', 'resolved', 'closed', 'info']),
  newStatus: z.enum(['submitted', 'assigned', 'in_progress', 'resolved', 'closed']).optional(),
  proofImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type UpdateForm = z.infer<typeof updateSchema>;

async function uploadImageToServer(file: File): Promise<string> {
  const form = new FormData();
  form.append('image', file);
  const res = await api.post<{ url: string }>('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
}

function UpdateModal({
  complaint,
  onClose,
}: {
  complaint: Complaint;
  onClose: () => void;
}) {
  const postUpdate = usePostStaffUpdate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: { updateType: 'response' },
  });

  const updateType = watch('updateType');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const url = await uploadImageToServer(file);
      setUploadedUrl(url);
      setValue('proofImageUrl', url);
    } catch {
      setUploadError('Upload failed. You can paste an image URL instead.');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: UpdateForm) {
    await postUpdate.mutateAsync({
      complaintId: complaint.id,
      message: data.message,
      updateType: data.updateType,
      proofImageUrl: data.proofImageUrl || undefined,
      newStatus: data.newStatus,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Post Update</h3>
            <p className="text-sm text-gray-500">{complaint.case_number} — {complaint.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Update type</label>
            <select {...register('updateType')} className="input-field">
              {UPDATE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {(updateType === 'resolved' || updateType === 'closed' || updateType === 'in_progress') && (
            <div>
              <label className="label">Change complaint status</label>
              <select {...register('newStatus')} className="input-field">
                <option value="">— Keep current status —</option>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Message</label>
            <textarea
              {...register('message')}
              rows={4}
              className="input-field"
              placeholder="Describe the action taken or provide information to the resident…"
            />
            {errors.message && <p className="form-error">{errors.message.message}</p>}
          </div>

          <div>
            <label className="label">Proof image (optional)</label>
            <div className="flex gap-2 items-center mb-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                {uploading ? 'Uploading…' : 'Upload image'}
              </button>
              {uploadedUrl && (
                <span className="text-green-600 text-xs font-medium">✓ Image uploaded</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              {...register('proofImageUrl')}
              className="input-field text-sm"
              placeholder="Or paste image URL: https://example.com/image.jpg"
            />
            {uploadError && <p className="form-error">{uploadError}</p>}
            {errors.proofImageUrl && <p className="form-error">{errors.proofImageUrl.message}</p>}
          </div>

          {postUpdate.error && (
            <div className="alert-error text-sm">
              {(postUpdate.error as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to post update.'}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={postUpdate.isPending || uploading} className="btn-primary flex-1">
              {postUpdate.isPending ? 'Posting…' : 'Post Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ComplaintRow({ complaint }: { complaint: Complaint }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 transition-colors">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{complaint.complaint_type.icon_emoji ?? '📋'}</span>
              <span className="text-xs font-medium text-gray-500">{complaint.complaint_type.name}</span>
              <span className="font-mono text-xs text-gray-300">{complaint.case_number}</span>
            </div>
            <p className="font-semibold text-gray-900 truncate">{complaint.title}</p>
            {complaint.address && (
              <p className="text-sm text-gray-500 mt-0.5">
                {complaint.address.street_address}, {complaint.address.city}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Submitted {format(new Date(complaint.created_at), 'MMM d, yyyy')}
              {complaint.updates?.[0] && ` · Last update ${format(new Date(complaint.updates[0].created_at), 'MMM d')}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={complaint.status} />
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Post update
            </button>
          </div>
        </div>
      </div>
      {showModal && <UpdateModal complaint={complaint} onClose={() => setShowModal(false)} />}
    </>
  );
}

export default function StaffDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: profile, isLoading: profileLoading } = useStaffProfile();
  const { data: complaints, isLoading: complaintsLoading } = useStaffComplaints();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = complaints?.filter((c) => {
    const matchesSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.case_number.includes(search.toUpperCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const titleLabel: Record<string, string> = {
    city_council: 'City Council',
    state_house: 'State House',
    state_senate: 'State Senate',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Staff Portal</h1>
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

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile card */}
        {!profileLoading && profile && (
          <div className="card flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700 flex-shrink-0">
              {user?.name?.charAt(0) ?? 'S'}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{profile.user.name}</p>
              <p className="text-sm text-gray-500">{profile.user.email}</p>
              {profile.official && (
                <p className="text-sm text-blue-700 mt-0.5">
                  Staff for {titleLabel[profile.official.title] ?? profile.official.title} — District {profile.official.district}: {profile.official.name}
                </p>
              )}
              {profile.department_name && !profile.official && (
                <p className="text-sm text-blue-700 mt-0.5">{profile.department_name}{profile.role ? ` · ${profile.role}` : ''}</p>
              )}
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${profile.email_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {profile.email_verified ? '✓ Approved' : '⏳ Pending Approval'}
            </div>
          </div>
        )}

        {/* Pending approval warning */}
        {!profileLoading && profile && !profile.email_verified && (
          <div className="alert-error">
            Your account is pending admin approval. You'll be able to view and respond to complaints once approved.
          </div>
        )}

        {/* Complaints section */}
        {!profileLoading && profile?.email_verified && (
          <>
            <div className="flex flex-wrap gap-3 items-center">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field max-w-xs text-sm"
                placeholder="Search complaints…"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field max-w-[160px] text-sm"
              >
                <option value="">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              {complaints && (
                <span className="text-sm text-gray-500">
                  {filtered?.length ?? 0} of {complaints.length} complaints
                </span>
              )}
            </div>

            {complaintsLoading ? (
              <div className="text-center py-16">
                <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filtered?.length === 0 ? (
              <div className="card text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">📭</p>
                <p className="font-medium">No complaints in your district</p>
                <p className="text-sm mt-1">Complaints will appear here when residents submit issues.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered?.map((c) => <ComplaintRow key={c.id} complaint={c} />)}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
