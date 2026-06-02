import { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/authService.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerResident(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }

  const { email, password, name } = parsed.data;
  const result = await authService.registerResident(email, password, name);
  res.status(201).json({ message: 'Registration successful. Check your email to verify.', user: result });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }

  const { email, password } = parsed.data;
  const result = await authService.login(email, password);
  res.json(result);
}

export async function logout(_req: Request, res: Response) {
  // Stateless JWT — client discards token. Future: add token blocklist via Redis.
  res.json({ message: 'Logged out successfully' });
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError(400, 'Refresh token required');
  const result = await authService.refreshToken(refreshToken);
  res.json(result);
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.params;
  if (!token) throw new AppError(400, 'Token required');

  const acceptsHtml = req.headers.accept?.includes('text/html');

  try {
    await authService.verifyEmail(token);
    if (acceptsHtml) {
      res.redirect(`${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/verify-email?token=${token}&verified=true`);
    } else {
      res.json({ message: 'Email verified successfully' });
    }
  } catch (err) {
    if (acceptsHtml) {
      res.redirect(`${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/verify-email?error=invalid_token`);
    } else {
      throw err;
    }
  }
}

export async function resendVerification(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) throw new AppError(400, 'Email required');
  const result = await authService.resendVerification(email);
  res.json(result);
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email || typeof email !== 'string') throw new AppError(400, 'Email required');
  const result = await authService.forgotPassword(email.toLowerCase().trim());
  res.json(result);
}

export async function resetPassword(req: Request, res: Response) {
  const schema = z.object({
    token: z.string().min(1, 'Token required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }
  const result = await authService.resetPassword(parsed.data.token, parsed.data.newPassword);
  res.json(result);
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const schema = z.object({
    name: z.string().min(2).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.errors.map((e) => e.message).join(', '));
  }
  const result = await authService.updateProfile(userId, parsed.data);
  res.json(result);
}
