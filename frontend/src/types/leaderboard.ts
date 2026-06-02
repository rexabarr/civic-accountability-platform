export interface OfficialGradeResult {
  id: string;
  name: string;
  title: string;
  district: number;
  city: string;
  state: string;
  party: string | null;
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | 'N/A';
  score: number;
  total_complaints: number;
  resolved_complaints: number;
  open_complaints: number;
  avg_days_to_resolve: number | null;
  resolution_rate: number;
  trend: 'up' | 'down' | 'stable' | 'new';
}

export const TITLE_LABELS: Record<string, string> = {
  city_council: 'City Council',
  state_house: 'State House',
  state_senate: 'State Senate',
};
