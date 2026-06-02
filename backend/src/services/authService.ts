import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { generateToken } from '../utils/crypto.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../utils/env.js';
import { sendPasswordResetEmail } from './emailService.js';

export async function registerResident(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'Email already registered');

  const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const verify_token = generateToken();
  const verify_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email,
      password_hash,
      name,
      user_type: 'resident' as string,
      is_verified: false,
      verify_token,
      verify_token_expires,
    },
  });

  console.log('\n========================================');
  console.log('✅ USER REGISTERED');
  console.log('📧 VERIFICATION LINK (paste in browser):');
  console.log(`http://localhost:5173/verify-email?token=${verify_token}`);
  console.log('========================================\n');

  return { id: user.id, email: user.email, name: user.name };
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      verify_token: token,
      verify_token_expires: { gt: new Date() },
    },
  });

  if (!user) throw new AppError(400, 'Invalid or expired verification token');

  await prisma.user.update({
    where: { id: user.id },
    data: { is_verified: true, verify_token: null, verify_token_expires: null },
  });

  return { message: 'Email verified successfully' };
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(404, 'No account found with that email');
  if (user.is_verified) throw new AppError(400, 'Email already verified');

  const verify_token = generateToken();
  const verify_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { verify_token, verify_token_expires },
  });

  console.log(`[EMAIL] Resend verification for ${email}`);
  console.log(`[EMAIL] Link: ${env.FRONTEND_URL}/verify-email?token=${verify_token}`);

  return { message: 'Verification email resent' };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(401, 'Invalid email or password');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError(401, 'Invalid email or password');

  if (!user.is_verified) throw new AppError(403, 'Please verify your email before logging in');

  const payload = { userId: user.id, email: user.email, userType: user.user_type };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, userType: user.user_type },
  };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to avoid revealing whether email exists
  if (!user) return { message: 'If that email is registered, a reset link has been sent.' };

  const reset_token = generateToken();
  const reset_token_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { reset_token, reset_token_expires },
  });

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${reset_token}`;
  sendPasswordResetEmail({ name: user.name, email: user.email, resetUrl });

  return { message: 'If that email is registered, a reset link has been sent.' };
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      reset_token: token,
      reset_token_expires: { gt: new Date() },
    },
  });

  if (!user) throw new AppError(400, 'Invalid or expired reset link. Please request a new one.');

  const password_hash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash, reset_token: null, reset_token_expires: null },
  });

  return { message: 'Password updated successfully. You can now log in.' };
}

export async function updateProfile(
  userId: string,
  updates: { name?: string; currentPassword?: string; newPassword?: string },
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  const data: { name?: string; password_hash?: string } = {};

  if (updates.name && updates.name.trim().length >= 2) {
    data.name = updates.name.trim();
  }

  if (updates.newPassword) {
    if (!updates.currentPassword) {
      throw new AppError(400, 'Current password is required to set a new password');
    }
    const valid = await bcrypt.compare(updates.currentPassword, user.password_hash);
    if (!valid) throw new AppError(400, 'Current password is incorrect');
    if (updates.newPassword.length < 8) {
      throw new AppError(400, 'New password must be at least 8 characters');
    }
    data.password_hash = await bcrypt.hash(updates.newPassword, env.BCRYPT_ROUNDS);
  }

  if (Object.keys(data).length === 0) {
    throw new AppError(400, 'Nothing to update');
  }

  const updated = await prisma.user.update({ where: { id: userId }, data });
  return { id: updated.id, email: updated.email, name: updated.name, userType: updated.user_type };
}

export async function refreshToken(token: string) {
  const payload = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new AppError(401, 'User not found');

  const newPayload = { userId: user.id, email: user.email, userType: user.user_type };
  const accessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  return { accessToken, refreshToken: newRefreshToken };
}
