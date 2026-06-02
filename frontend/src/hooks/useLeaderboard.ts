import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import type { OfficialGradeResult } from '../types/leaderboard';

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get<OfficialGradeResult[]>('/api/leaderboard').then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useOfficialGrade(officialId: string) {
  return useQuery({
    queryKey: ['official-grade', officialId],
    queryFn: () =>
      api.get<OfficialGradeResult>(`/api/leaderboard/${officialId}`).then((r) => r.data),
    enabled: !!officialId,
  });
}
