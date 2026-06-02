import { useMutation } from '@tanstack/react-query';
import api from '../utils/api';

interface GeocodeResult {
  address: {
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    latitude: number;
    longitude: number;
  };
  districts: {
    city_council_district: number | null;
    state_house_district: number | null;
    state_senate_district: number | null;
    officials: Array<{
      id: string;
      name: string;
      title: string;
      district: number;
      email: string | null;
      party: string | null;
    }>;
  };
}

export function useGeocode() {
  return useMutation({
    mutationFn: (address: string) =>
      api
        .get<GeocodeResult>('/api/geocode', { params: { address } })
        .then((r) => r.data),
  });
}
