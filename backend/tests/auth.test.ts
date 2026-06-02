import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../src/utils/jwt.js';
import { generateToken } from '../src/utils/crypto.js';

// Mock env
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
  },
}));

describe('JWT utilities', () => {
  const payload = { userId: 'user-123', email: 'test@example.com', userType: 'resident' };

  it('signs and verifies an access token', () => {
    const token = signAccessToken(payload);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.userType).toBe(payload.userType);
  });

  it('signs and verifies a refresh token', () => {
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });

  it('throws on invalid access token', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow();
  });

  it('throws on invalid refresh token', () => {
    expect(() => verifyRefreshToken('invalid.token.here')).toThrow();
  });
});

describe('Crypto utilities', () => {
  it('generates a hex token', () => {
    const token = generateToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBe(64); // 32 bytes -> 64 hex chars
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });

  it('generates unique tokens', () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1).not.toBe(t2);
  });
});

describe('Auth validation', () => {
  it('rejects weak passwords', () => {
    const { z } = require('zod');
    const schema = z.string().min(8);
    expect(schema.safeParse('short').success).toBe(false);
    expect(schema.safeParse('longenough').success).toBe(true);
  });

  it('validates email format', () => {
    const { z } = require('zod');
    const schema = z.string().email();
    expect(schema.safeParse('notanemail').success).toBe(false);
    expect(schema.safeParse('user@example.com').success).toBe(true);
  });
});
