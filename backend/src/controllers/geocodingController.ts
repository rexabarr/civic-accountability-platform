import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import * as geocodingService from '../services/geocodingService.js';

export async function geocode(req: Request, res: Response) {
  const { address } = req.query;
  if (!address || typeof address !== 'string') {
    throw new AppError(400, 'address query parameter is required');
  }
  const result = await geocodingService.geocodeAndGetDistricts(address);
  res.json(result);
}

export async function getDistricts(req: Request, res: Response) {
  const { lat, lng } = req.query;
  if (!lat || !lng) throw new AppError(400, 'lat and lng query parameters are required');

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new AppError(400, 'lat and lng must be valid numbers');
  }

  const result = await geocodingService.getDistricts(latitude, longitude);
  res.json(result);
}
