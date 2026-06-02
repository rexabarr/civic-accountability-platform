import { prisma } from '../utils/prisma.js';

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F' | 'N/A';

export interface OfficialGradeResult {
  id: string;
  name: string;
  title: string;
  district: number;
  city: string;
  state: string;
  party: string | null;
  grade: LetterGrade;
  score: number;
  total_complaints: number;
  resolved_complaints: number;
  open_complaints: number;
  avg_days_to_resolve: number | null;
  resolution_rate: number;
  trend: 'up' | 'down' | 'stable' | 'new';
}

const TITLE_DISTRICT_FIELD: Record<string, string> = {
  city_council: 'city_council_district',
  state_house: 'state_house_district',
  state_senate: 'state_senate_district',
};

function scoreToGrade(score: number, total: number): LetterGrade {
  if (total === 0) return 'N/A';
  if (score >= 85) return 'A';
  if (score >= 72) return 'B';
  if (score >= 58) return 'C';
  if (score >= 44) return 'D';
  return 'F';
}

export async function gradeAllOfficials(): Promise<OfficialGradeResult[]> {
  const officials = await prisma.electedOfficial.findMany({
    orderBy: [{ title: 'asc' }, { district: 'asc' }],
  });

  const results: OfficialGradeResult[] = [];

  for (const official of officials) {
    const districtField = TITLE_DISTRICT_FIELD[official.title];
    if (!districtField) continue;

    // Find all complaints in this official's district
    const complaints = await prisma.complaint.findMany({
      where: {
        address: { [districtField]: official.district },
        is_public: true,
      },
      include: {
        complaint_type: { select: { avg_resolution_days: true } },
        updates: { orderBy: { created_at: 'asc' }, take: 2 },
      },
      orderBy: { created_at: 'desc' },
    });

    const total = complaints.length;
    const resolved = complaints.filter((c) =>
      c.status === 'resolved' || c.status === 'closed',
    ).length;
    const open = complaints.filter((c) =>
      c.status === 'submitted' || c.status === 'assigned' || c.status === 'in_progress',
    ).length;

    // Average days to resolve (closed complaints only)
    const closedWithTime = complaints.filter(
      (c) => (c.status === 'resolved' || c.status === 'closed') && c.resolved_at,
    );
    const avgDays =
      closedWithTime.length > 0
        ? closedWithTime.reduce((sum, c) => {
            const days =
              (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) /
              86_400_000;
            return sum + days;
          }, 0) / closedWithTime.length
        : null;

    // Resolution rate as percentage
    const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

    // Speed score: compare avg_days to expected avg
    let speedScore = 75; // default neutral
    if (avgDays !== null) {
      const expectedDays =
        complaints
          .filter((c) => c.complaint_type.avg_resolution_days)
          .reduce((sum, c) => sum + (c.complaint_type.avg_resolution_days ?? 14), 0) /
          Math.max(1, complaints.filter((c) => c.complaint_type.avg_resolution_days).length) || 14;

      if (avgDays <= expectedDays) speedScore = 100;
      else if (avgDays <= expectedDays * 1.5) speedScore = 80;
      else if (avgDays <= expectedDays * 2) speedScore = 60;
      else if (avgDays <= expectedDays * 3) speedScore = 40;
      else speedScore = 20;
    }

    // Open complaint burden penalty (over 5 unresolved = penalty)
    const burdenPenalty = Math.max(0, (open - 5) * 2);

    // Composite score
    let score: number;
    if (total === 0) {
      score = 0;
    } else {
      score = resolutionRate * 0.6 + speedScore * 0.4 - burdenPenalty;
      score = Math.max(0, Math.min(100, score));
    }

    // Trend: compare last 30 days vs prior 30 days resolution rate
    const now = Date.now();
    const recent = complaints.filter(
      (c) => now - new Date(c.created_at).getTime() < 30 * 86_400_000,
    );
    const older = complaints.filter((c) => {
      const age = now - new Date(c.created_at).getTime();
      return age >= 30 * 86_400_000 && age < 60 * 86_400_000;
    });
    const recentRate =
      recent.length > 0
        ? (recent.filter((c) => c.status === 'resolved' || c.status === 'closed').length /
            recent.length) *
          100
        : null;
    const olderRate =
      older.length > 0
        ? (older.filter((c) => c.status === 'resolved' || c.status === 'closed').length /
            older.length) *
          100
        : null;

    let trend: OfficialGradeResult['trend'] = 'new';
    if (recentRate !== null && olderRate !== null) {
      if (recentRate - olderRate > 10) trend = 'up';
      else if (olderRate - recentRate > 10) trend = 'down';
      else trend = 'stable';
    } else if (total > 0) {
      trend = 'stable';
    }

    results.push({
      id: official.id,
      name: official.name,
      title: official.title,
      district: official.district,
      city: official.city,
      state: official.state,
      party: official.party,
      grade: scoreToGrade(score, total),
      score: Math.round(score),
      total_complaints: total,
      resolved_complaints: resolved,
      open_complaints: open,
      avg_days_to_resolve: avgDays !== null ? Math.round(avgDays * 10) / 10 : null,
      resolution_rate: Math.round(resolutionRate),
      trend,
    });
  }

  // Sort: graded officials first (by score desc), then N/A
  return results.sort((a, b) => {
    if (a.grade === 'N/A' && b.grade !== 'N/A') return 1;
    if (b.grade === 'N/A' && a.grade !== 'N/A') return -1;
    return b.score - a.score;
  });
}

export async function gradeOneOfficial(officialId: string): Promise<OfficialGradeResult | null> {
  const all = await gradeAllOfficials();
  return all.find((o) => o.id === officialId) ?? null;
}
