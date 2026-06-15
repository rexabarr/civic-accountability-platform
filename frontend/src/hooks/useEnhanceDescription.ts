import { useMutation } from '@tanstack/react-query';
import api from '../utils/api';

interface EnhancedDescription {
  original: string;
  improved: string;
  summary: string;
}

export function useEnhanceDescription() {
  return useMutation({
    mutationFn: (description: string) =>
      api.post<EnhancedDescription>('/api/complaints/enhance-description', { description }).then((r) => r.data),
  });
}
