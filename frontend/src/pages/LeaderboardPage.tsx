import { useState } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useLeaderboard } from '../hooks/useLeaderboard';
import GradeBadge from '../components/GradeBadge';
import { TITLE_LABELS } from '../types/leaderboard';
import type { OfficialGradeResult } from '../types/leaderboard';

type FilterTitle = 'all' | 'city_council' | 'state_house' | 'state_senate';

const TREND_ICONS: Record<string, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
  new: '★',
};
const TREND_COLORS: Record<string, string> = {
  up: 'text-emerald-600',
  down: 'text-red-500',
  stable: 'text-gray-400',
  new: 'text-blue-400',
};

function StatPill({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function OfficialRow({ official, rank }: { official: OfficialGradeResult; rank: number }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all">
      <span className="text-sm font-bold text-gray-300 w-6 text-center flex-shrink-0">
        {official.grade !== 'N/A' ? rank : '—'}
      </span>

      <GradeBadge grade={official.grade} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-gray-900">{official.name}</p>
          {official.party && (
            <span className={clsx(
              'text-xs px-1.5 py-0.5 rounded font-medium',
              official.party === 'Democrat' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700',
            )}>
              {official.party.charAt(0)}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {TITLE_LABELS[official.title] ?? official.title} · District {official.district}
        </p>
      </div>

      <div className="hidden sm:flex gap-6 items-center flex-shrink-0">
        {official.total_complaints > 0 ? (
          <>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-700">{official.resolution_rate}%</p>
              <p className="text-xs text-gray-400">resolved</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-700">{official.total_complaints}</p>
              <p className="text-xs text-gray-400">complaints</p>
            </div>
            {official.avg_days_to_resolve !== null && (
              <div className="text-center">
                <p className="text-sm font-bold text-gray-700">{official.avg_days_to_resolve}d</p>
                <p className="text-xs text-gray-400">avg resolve</p>
              </div>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-300 italic">No complaints yet</span>
        )}
      </div>

      <div className={clsx('text-lg font-bold flex-shrink-0 w-6 text-center', TREND_COLORS[official.trend])}>
        {TREND_ICONS[official.trend]}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { data: officials, isLoading } = useLeaderboard();
  const [filter, setFilter] = useState<FilterTitle>('all');
  const [search, setSearch] = useState('');

  const filtered = officials?.filter((o) => {
    const matchesType = filter === 'all' || o.title === filter;
    const matchesSearch =
      !search || o.name.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const graded = filtered?.filter((o) => o.grade !== 'N/A') ?? [];
  const unrated = filtered?.filter((o) => o.grade === 'N/A') ?? [];

  // Summary stats
  const aCount = officials?.filter((o) => o.grade === 'A').length ?? 0;
  const fCount = officials?.filter((o) => o.grade === 'F').length ?? 0;
  const totalComplaints = officials?.reduce((s, o) => s + o.total_complaints, 0) ?? 0;
  const avgResolution =
    graded.length > 0
      ? Math.round(graded.reduce((s, o) => s + o.resolution_rate, 0) / graded.length)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <Link to="/" className="text-blue-300 text-sm hover:text-white">
              Civic Accountability Platform
            </Link>
            <Link to="/dashboard" className="btn-secondary text-sm py-1 px-3 text-blue-900">
              Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold">Philadelphia Rep Scorecard</h1>
          <p className="text-blue-300 text-sm mt-0.5">
            Officials graded A–F on complaint resolution. Updated in real time.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Summary stats */}
        {!isLoading && officials && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Officials Tracked', value: officials.length },
              { label: 'Top Grade (A)', value: aCount, sub: 'officials' },
              { label: 'Failing (F)', value: fCount, sub: 'officials' },
              { label: 'Avg Resolution', value: `${avgResolution}%`, sub: `${totalComplaints} complaints` },
            ].map((s) => (
              <div key={s.label} className="card text-center py-3">
                <StatPill {...s} />
              </div>
            ))}
          </div>
        )}

        {/* Grade legend */}
        <div className="card py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="text-gray-500 font-medium">Grade key:</span>
            {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => (
              <div key={g} className="flex items-center gap-1.5">
                <GradeBadge grade={g} size="sm" />
                <span className="text-gray-600">
                  {g === 'A' && '≥85% resolved'}
                  {g === 'B' && '72–84%'}
                  {g === 'C' && '58–71%'}
                  {g === 'D' && '44–57%'}
                  {g === 'F' && '<44%'}
                </span>
              </div>
            ))}
            <span className="text-gray-400 text-xs ml-auto">
              Trend: ↑ improving · ↓ declining · → stable · ★ new
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1">
            {(['all', 'city_council', 'state_house', 'state_senate'] as FilterTitle[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  filter === f ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {f === 'all' ? 'All' : TITLE_LABELS[f]}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field max-w-xs text-sm"
            placeholder="Search by name…"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400">Calculating grades…</p>
          </div>
        )}

        {/* Graded officials */}
        {!isLoading && graded.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Ranked Officials ({graded.length})
            </h2>
            {graded.map((official, i) => (
              <OfficialRow key={official.id} official={official} rank={i + 1} />
            ))}
          </div>
        )}

        {/* Unrated officials */}
        {!isLoading && unrated.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Not Yet Rated — No complaints filed ({unrated.length})
            </h2>
            <div className="space-y-1">
              {unrated.map((official) => (
                <OfficialRow key={official.id} official={official} rank={0} />
              ))}
            </div>
          </div>
        )}

        {!isLoading && filtered?.length === 0 && (
          <p className="text-center text-gray-400 py-12">No officials match your filters.</p>
        )}

        <div className="card bg-blue-50 border-blue-200 text-sm text-blue-700 text-center">
          Grades reflect real complaint data submitted by Philadelphia residents.{' '}
          <Link to="/submit" className="font-semibold underline">
            Submit a complaint
          </Link>{' '}
          to hold your representatives accountable.
        </div>
      </main>
    </div>
  );
}
