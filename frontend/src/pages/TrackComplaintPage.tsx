import { useState, useCallback } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useTrackComplaint } from '../hooks/useComplaints';
import { StatusBadge, SeverityBadge } from '../components/StatusBadge';

export default function TrackComplaintPage() {
  const { caseNumber } = useParams<{ caseNumber: string }>();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('new') === '1';
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  const { data: complaint, isLoading, error } = useTrackComplaint(caseNumber ?? '');
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = complaint
    ? `Tracking civic complaint ${complaint.case_number}: ${complaint.title} — Philadelphia, PA`
    : 'Civic Accountability Platform — Philadelphia';

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({ title: shareText, url: shareUrl });
    }
  }, [shareText, shareUrl]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const val = searchInput.trim().toUpperCase();
    if (val) navigate(`/track/${val}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <Link to="/" className="text-blue-300 text-sm hover:text-white">
              Civic Accountability Platform
            </Link>
            <h1 className="text-xl font-bold mt-1">Complaint Tracker</h1>
          </div>
          <Link to="/dashboard" className="btn-secondary text-sm py-1 px-3 text-blue-900">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input-field flex-1 font-mono uppercase"
            placeholder="Enter case number (e.g. CAP-2026-A1B2C3)"
          />
          <button type="submit" className="btn-primary">Track</button>
        </form>

        {/* New submission banner */}
        {isNew && complaint && (
          <div className="alert-success">
            <p className="font-bold text-lg">🎉 Complaint submitted successfully!</p>
            <p className="mt-1">Your case number is <span className="font-mono font-bold">{complaint.case_number}</span>. Save it to track your complaint anytime.</p>
            <p className="text-sm mt-1">
              Notifications sent to {complaint.assigned_department} and your elected officials.
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="card text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading complaint…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert-error">
            <p className="font-medium">Complaint not found</p>
            <p className="text-sm mt-1">
              No public complaint found with case number <span className="font-mono">{caseNumber}</span>. Double-check the case number and try again.
            </p>
          </div>
        )}

        {/* Complaint detail */}
        {complaint && !isLoading && (
          <>
            <div className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{complaint.complaint_type.icon_emoji ?? '📋'}</span>
                    <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {complaint.complaint_type.name}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{complaint.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {complaint.address.street_address}, {complaint.address.city}, {complaint.address.state} {complaint.address.zip_code}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={complaint.status} />
                  <SeverityBadge severity={complaint.severity} />
                  <span className="font-mono text-xs text-gray-400">{complaint.case_number}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-700">{complaint.description}</p>
              </div>

              <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Assigned to</p>
                  <p className="font-medium text-gray-800">{complaint.assigned_department ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Submitted</p>
                  <p className="font-medium text-gray-800">
                    {format(new Date(complaint.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                {complaint.resolved_at && (
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Resolved</p>
                    <p className="font-medium text-green-700">
                      {format(new Date(complaint.resolved_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Activity Timeline</h3>
              {complaint.updates.length === 0 ? (
                <p className="text-sm text-gray-400">No updates yet.</p>
              ) : (
                <ol className="relative border-l border-gray-200 space-y-6 ml-3">
                  {complaint.updates.map((update) => (
                    <li key={update.id} className="ml-6">
                      <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xs font-bold ring-4 ring-white">
                        {update.update_type === 'submitted' ? '✓' : '↻'}
                      </span>
                      <p className="text-sm font-medium text-gray-800">{update.message}</p>
                      <time className="text-xs text-gray-400 mt-0.5 block">
                        {format(new Date(update.created_at), 'MMM d, yyyy h:mm a')}
                      </time>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Share */}
            <div className="card bg-gray-50">
              <p className="text-sm font-medium text-gray-600 mb-3 text-center">
                Share complaint <span className="font-mono font-bold text-gray-800">{complaint.case_number}</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={handleNativeShare}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>↑</span> Share
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {copied ? '✓ Copied!' : '🔗 Copy link'}
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <span className="font-bold">𝕏</span> Post
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-800 text-white text-sm font-medium rounded-lg hover:bg-blue-900 transition-colors"
                >
                  Facebook
                </a>
              </div>
            </div>
          </>
        )}

        {/* No case number yet */}
        {!caseNumber && !isLoading && (
          <div className="card text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>Enter a case number above to track a complaint.</p>
          </div>
        )}
      </main>
    </div>
  );
}
