import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { AppError } from './errorHandler.js';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'No token provided');
  }

  const token = authHeader.slice(7);
  req.user = verifyAccessToken(token);
  next();
}

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction): void {
  requireAuth(req, _res, () => {
    if (req.user?.userType !== 'admin') {
      throw new AppError(403, 'Admin access required');
    }
    next();
  });
}
