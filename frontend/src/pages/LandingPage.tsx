import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl font-bold text-white mb-4">Civic Accountability</h1>
        <p className="text-xl text-blue-200 mb-2">Philadelphia Government Transparency Platform</p>
        <p className="text-blue-300 mb-10 max-w-lg mx-auto">
          Report local issues directly to your elected officials. Track responses. Hold your
          government accountable.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/register"
            className="bg-white text-blue-900 font-bold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/leaderboard"
            className="border-2 border-blue-400 text-blue-200 font-bold px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors"
          >
            Rep Scorecard
          </Link>
          <Link
            to="/register-staff"
            className="border-2 border-blue-600 text-blue-300 font-bold px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors"
          >
            Staff / Rep Portal
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 text-center">
          {[
            { icon: '📋', title: 'Report Issues', desc: 'Submit complaints about local problems' },
            { icon: '🏛️', title: 'Route to Officials', desc: 'Auto-assigned to your district reps' },
            { icon: '📊', title: 'Track Progress', desc: 'Monitor response times publicly' },
          ].map((f) => (
            <div key={f.title} className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl mb-2">{f.icon}</div>
              <p className="font-semibold text-white text-sm">{f.title}</p>
              <p className="text-blue-300 text-xs mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
