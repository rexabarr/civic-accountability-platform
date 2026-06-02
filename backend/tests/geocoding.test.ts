import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/utils/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-32-chars-minimum!!',
    JWT_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    BCRYPT_ROUNDS: 10,
    NODE_ENV: 'test',
    PORT: 3000,
    CORS_ORIGIN: 'http://localhost:5173',
    FRONTEND_URL: 'http://localhost:5173',
    GOOGLE_MAPS_API_KEY: undefined,
  },
}));

vi.mock('../src/utils/prisma.js', () => ({
  prisma: {
    address: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'addr-1',
        street_address: '123 Broad St',
        city: 'Philadelphia',
        state: 'PA',
        zip_code: '19107',
        latitude: 39.9526,
        longitude: -75.1652,
      }),
    },
    electedOfficial: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'city_council-3-phila',
          name: 'Jamie Gauthier',
          title: 'city_council',
          district: 3,
          email: null,
          party: 'Democrat',
        },
        {
          id: 'state_house-186-phila',
          name: 'Jordan Harris',
          title: 'state_house',
          district: 186,
          email: null,
          party: 'Democrat',
        },
        {
          id: 'state_senate-5-phila',
          name: 'John Sabatina Jr.',
          title: 'state_senate',
          district: 5,
          email: null,
          party: 'Democrat',
        },
      ]),
    },
  },
}));

describe('Geocoding service', () => {
  it('returns mock geocode for address without API key', async () => {
    const { geocodeAddress } = await import('../src/services/geocodingService.js');
    const result = await geocodeAddress('123 Broad St, Philadelphia, PA');
    expect(result).toHaveProperty('latitude');
    expect(result).toHaveProperty('longitude');
    expect(result.city).toBe('Philadelphia');
  });

  it('returns district info for Philadelphia coordinates', async () => {
    const { getDistricts } = await import('../src/services/geocodingService.js');
    const result = await getDistricts(39.9526, -75.1652);
    expect(result).toHaveProperty('officials');
    expect(Array.isArray(result.officials)).toBe(true);
  });

  it('geocodeAndGetDistricts returns address and officials', async () => {
    const { geocodeAndGetDistricts } = await import('../src/services/geocodingService.js');
    const result = await geocodeAndGetDistricts('123 Broad St');
    expect(result).toHaveProperty('address');
    expect(result).toHaveProperty('districts');
    expect(result.districts).toHaveProperty('officials');
  });
});
