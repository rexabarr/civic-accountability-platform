import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useAuth';
import { useGeocode } from '../hooks/useGeocode';
import { useMyComplaints } from '../hooks/useComplaints';
import OfficialCard from '../components/OfficialCard';
import ComplaintCard from '../components/ComplaintCard';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const geocode = useGeocode();
  const { data: complaints, isLoading: complaintsLoading } = useMyComplaints();
  const [address, setAddress] = useState('');

  const handleGeocode = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) geocode.mutate(address.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Civic Accountability Platform</h1>
          <p className="text-blue-300 text-sm">Philadelphia</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/leaderboard" className="text-blue-300 text-sm hover:text-white hidden sm:block">
            Rep Scorecard
          </Link>
          {user?.userType === 'rep_staff' && (
            <Link to="/staff" className="text-blue-300 text-sm hover:text-white hidden sm:block">
              Staff Portal
            </Link>
          )}
          {user?.userType === 'admin' && (
            <Link to="/admin" className="text-yellow-300 text-sm hover:text-white hidden sm:block font-medium">
              Admin
            </Link>
          )}
          <span className="text-sm text-blue-200 hidden sm:block">Hello, {user?.name}</span>
          <button onClick={logout} className="btn-secondary text-sm py-1 px-3">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Submit CTA */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 rounded-xl p-5 text-white flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Report a problem</h2>
            <p className="text-blue-200 text-sm mt-0.5">
              Submit a complaint and we'll route it to the right department and notify your elected officials.
            </p>
          </div>
          <Link
            to="/submit"
            className="flex-shrink-0 bg-white text-blue-800 font-bold px-5 py-2 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            + New Complaint
          </Link>
        </div>

        {/* My Complaints */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Complaints</h2>
            <Link to="/track" className="text-sm text-blue-600 hover:underline">
              Track by case #
            </Link>
          </div>

          {complaintsLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : complaints?.length === 0 || !complaints ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="font-medium">No complaints yet</p>
              <p className="text-sm mt-1">Submit your first complaint to get started.</p>
              <Link to="/submit" className="btn-primary inline-block mt-4 text-sm">
                Report an Issue
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <ComplaintCard key={c.id} complaint={c} />
              ))}
            </div>
          )}
        </div>

        {/* Address / Officials lookup */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-1">Find Your Representatives</h2>
          <p className="text-sm text-gray-500 mb-4">
            Enter any Philadelphia address to see the elected officials who represent it.
          </p>

          <form onSubmit={handleGeocode} className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field flex-1"
              placeholder="e.g. 123 Broad St, Philadelphia, PA"
            />
            <button
              type="submit"
              disabled={geocode.isPending || !address.trim()}
              className="btn-primary whitespace-nowrap"
            >
              {geocode.isPending ? 'Looking up…' : 'Look up'}
            </button>
          </form>

          {geocode.error && (
            <div className="alert-error mt-4">Could not find that address. Please try again.</div>
          )}

          {geocode.data && (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-medium text-gray-600">
                ✓ {geocode.data.address.street_address}, {geocode.data.address.city}, {geocode.data.address.state}
              </p>
              <div className="space-y-2">
                {geocode.data.districts.officials.length === 0 ? (
                  <p className="text-sm text-gray-400">No officials found — make sure the database is seeded.</p>
                ) : (
                  geocode.data.districts.officials.map((o) => (
                    <OfficialCard key={o.id} official={o} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
