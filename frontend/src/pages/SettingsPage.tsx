import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { useLogout, useUpdateProfile } from '../hooks/useAuth';

// ── Name form ──────────────────────────────────────────────────────────────
const nameSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});
type NameForm = z.infer<typeof nameSchema>;

// ── Password form ──────────────────────────────────────────────────────────
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const updateProfile = useUpdateProfile();
  const [nameSaved, setNameSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Residents only — redirect others
  if (!user) return <Navigate to="/login" replace />;
  if (user.userType !== 'resident') {
    return <Navigate to={user.userType === 'admin' ? '/admin' : '/staff'} replace />;
  }

  const nameForm = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user.name },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  function onNameSubmit(data: NameForm) {
    updateProfile.mutate(
      { name: data.name },
      {
        onSuccess: () => {
          setNameSaved(true);
          setTimeout(() => setNameSaved(false), 3000);
        },
      },
    );
  }

  function onPasswordSubmit(data: PasswordForm) {
    updateProfile.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          setPasswordSaved(true);
          passwordForm.reset();
          setTimeout(() => setPasswordSaved(false), 3000);
        },
      },
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <Link to="/dashboard" className="text-blue-300 text-sm hover:text-white">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold mt-1">Account Settings</h1>
        </div>
        <button onClick={logout} className="btn-secondary text-sm py-1 px-3">
          Sign out
        </button>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-6">
        {/* Account info banner */}
        <div className="card bg-blue-50 border-blue-100">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">{user.email}</span>
            <span className="ml-2 text-blue-500">· Email cannot be changed</span>
          </p>
        </div>

        {/* Display name */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Display Name</h2>
          <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-3">
            <div>
              <label className="label">Full name</label>
              <input
                {...nameForm.register('name')}
                className="input-field"
                placeholder="Your full name"
              />
              {nameForm.formState.errors.name && (
                <p className="form-error">{nameForm.formState.errors.name.message}</p>
              )}
            </div>
            {updateProfile.error && !passwordSaved && (
              <div className="alert-error text-sm">
                {(updateProfile.error as { response?: { data?: { error?: string } } })?.response?.data
                  ?.error ?? 'Failed to update name.'}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="btn-primary"
              >
                {updateProfile.isPending && !passwordSaved ? 'Saving...' : 'Save name'}
              </button>
              {nameSaved && (
                <span className="text-green-600 text-sm font-medium">✓ Saved</span>
              )}
            </div>
          </form>
        </div>

        {/* Change password */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3">
            <div>
              <label className="label">Current password</label>
              <input
                {...passwordForm.register('currentPassword')}
                type="password"
                className="input-field"
                placeholder="Your current password"
                autoComplete="current-password"
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="form-error">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div>
              <label className="label">New password</label>
              <input
                {...passwordForm.register('newPassword')}
                type="password"
                className="input-field"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="form-error">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                {...passwordForm.register('confirmPassword')}
                type="password"
                className="input-field"
                placeholder="Repeat your new password"
                autoComplete="new-password"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="form-error">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            {updateProfile.error && !nameSaved && (
              <div className="alert-error text-sm">
                {(updateProfile.error as { response?: { data?: { error?: string } } })?.response?.data
                  ?.error ?? 'Failed to update password.'}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="btn-primary"
              >
                {updateProfile.isPending && !nameSaved ? 'Updating...' : 'Update password'}
              </button>
              {passwordSaved && (
                <span className="text-green-600 text-sm font-medium">✓ Password updated</span>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
