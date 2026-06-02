import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../utils/env.js';

interface GeocodeResult {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
}

interface DistrictResult {
  city_council_district: number | null;
  state_house_district: number | null;
  state_senate_district: number | null;
  officials: OfficialSummary[];
}

interface OfficialSummary {
  id: string;
  name: string;
  title: string;
  district: number;
  email: string | null;
  party: string | null;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const cached = await prisma.address.findFirst({
    where: { street_address: { contains: address } },
    orderBy: { created_at: 'desc' },
  });

  if (cached) {
    return {
      street_address: cached.street_address,
      city: cached.city,
      state: cached.state,
      zip_code: cached.zip_code,
      latitude: Number(cached.latitude),
      longitude: Number(cached.longitude),
    };
  }

  if (!env.GOOGLE_MAPS_API_KEY) {
    return mockGeocode(address);
  }

  const encoded = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${env.GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);
  const data = (await response.json()) as {
    status: string;
    results: Array<{
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
      address_components: Array<{ long_name: string; short_name: string; types: string[] }>;
    }>;
  };

  if (data.status !== 'OK' || !data.results.length) {
    throw new AppError(400, `Could not geocode address: ${address}`);
  }

  const result = data.results[0];
  const { lat, lng } = result.geometry.location;
  const components = result.address_components;

  const getComponent = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name ?? '';

  const streetNumber = getComponent('street_number');
  const streetName = getComponent('route');
  const city = getComponent('locality') || getComponent('sublocality') || 'Philadelphia';
  const state = components.find((c) => c.types.includes('administrative_area_level_1'))?.short_name ?? 'PA';
  const zip = getComponent('postal_code');

  return {
    street_address: `${streetNumber} ${streetName}`.trim(),
    city,
    state,
    zip_code: zip,
    latitude: lat,
    longitude: lng,
  };
}

export async function getDistricts(lat: number, lng: number): Promise<DistrictResult> {
  // Philadelphia-specific district assignment by approximate lat/lng ranges
  // In production this would call a proper district boundary API (e.g., Census Bureau)
  const districts = assignPhillyDistricts(lat, lng);

  const officials = await prisma.electedOfficial.findMany({
    where: {
      city: 'Philadelphia',
      state: 'PA',
      OR: [
        { title: 'city_council', district: districts.city_council ?? undefined },
        { title: 'state_house', district: districts.state_house ?? undefined },
        { title: 'state_senate', district: districts.state_senate ?? undefined },
      ],
    },
  });

  return {
    city_council_district: districts.city_council,
    state_house_district: districts.state_house,
    state_senate_district: districts.state_senate,
    officials: officials.map((o) => ({
      id: o.id,
      name: o.name,
      title: o.title,
      district: o.district,
      email: o.email,
      party: o.party,
    })),
  };
}

export async function geocodeAndGetDistricts(address: string) {
  const geo = await geocodeAddress(address);

  let addressRecord = await prisma.address.findUnique({
    where: {
      street_address_city_state_zip_code: {
        street_address: geo.street_address,
        city: geo.city,
        state: geo.state,
        zip_code: geo.zip_code,
      },
    },
  });

  const districts = assignPhillyDistricts(geo.latitude, geo.longitude);

  if (!addressRecord) {
    addressRecord = await prisma.address.create({
      data: {
        street_address: geo.street_address,
        city: geo.city,
        state: geo.state,
        zip_code: geo.zip_code,
        latitude: geo.latitude,
        longitude: geo.longitude,
        city_council_district: districts.city_council,
        state_house_district: districts.state_house,
        state_senate_district: districts.state_senate,
      },
    });
  }

  const districtResult = await getDistricts(geo.latitude, geo.longitude);

  return { address: geo, districts: districtResult };
}

function mockGeocode(address: string): GeocodeResult {
  // Broad St, Philadelphia rough center
  return {
    street_address: address,
    city: 'Philadelphia',
    state: 'PA',
    zip_code: '19107',
    latitude: 39.9526,
    longitude: -75.1652,
  };
}

function assignPhillyDistricts(lat: number, lng: number): {
  city_council: number | null;
  state_house: number | null;
  state_senate: number | null;
} {
  // Simplified Philadelphia district assignment based on lat/lng quadrants
  // Real implementation would use shapefile/GIS boundary checks
  if (lat >= 40.0 && lng >= -75.1) return { city_council: 8, state_house: 175, state_senate: 5 };
  if (lat >= 40.0 && lng < -75.1) return { city_council: 6, state_house: 170, state_senate: 4 };
  if (lat >= 39.98 && lng >= -75.15) return { city_council: 5, state_house: 182, state_senate: 5 };
  if (lat >= 39.97) return { city_council: 3, state_house: 184, state_senate: 5 };
  if (lat >= 39.95 && lng >= -75.17) return { city_council: 2, state_house: 197, state_senate: 8 };
  if (lat >= 39.95) return { city_council: 3, state_house: 186, state_senate: 5 };
  if (lat >= 39.92 && lng >= -75.2) return { city_council: 1, state_house: 188, state_senate: 7 };
  if (lat >= 39.92) return { city_council: 3, state_house: 189, state_senate: 7 };
  return { city_council: 2, state_house: 197, state_senate: 8 };
}
