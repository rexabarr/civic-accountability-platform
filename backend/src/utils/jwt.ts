import jwt from 'jsonwebtoken';
import { env } from './env.js';

export interface TokenPayload {
  userId: string;
  email: string;
  userType: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY } as jwt.SignOptions);
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET + '_refresh', {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET + '_refresh') as TokenPayload;
}
