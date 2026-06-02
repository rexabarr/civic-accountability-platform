import { useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthLayout from '../components/AuthLayout';
import { useResetPassword } from '../hooks/useAuth';

const schema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const resetPassword = useResetPassword();

  // Redirect to login after successful reset
  useEffect(() => {
    if (resetPassword.isSuccess) {
      const timer = setTimeout(() => navigate('/login'), 2500);
      return () => clearTimeout(timer);
    }
  }, [resetPassword.isSuccess, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    resetPassword.mutate({ token, newPassword: data.newPassword });
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="">
        <div className="alert-error text-center">
          <p>This reset link is missing or invalid.</p>
          <Link to="/forgot-password" className="text-blue-700 font-medium hover:underline mt-2 block">
            Request a new reset link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (resetPassword.isSuccess) {
    return (
      <AuthLayout title="Password updated!" subtitle="You can now sign in with your new password">
        <div className="alert-success text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="font-semibold">Password changed successfully.</p>
          <p className="text-sm mt-1 text-green-700">Redirecting you to sign in...</p>
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">
          <Link to="/login" className="text-blue-700 font-medium hover:underline">
            Sign in now →
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password for your account">
      {resetPassword.error && (
        <div className="alert-error mb-4">
          {(resetPassword.error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            'This link has expired or is invalid. Please request a new one.'}
          <Link to="/forgot-password" className="block text-sm mt-1 underline">
            Request a new link
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="form-label">New password</label>
          <input
            {...register('newPassword')}
            type="password"
            className="input-field"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          {errors.newPassword && <p className="form-error">{errors.newPassword.message}</p>}
        </div>

        <div>
          <label className="form-label">Confirm new password</label>
          <input
            {...register('confirmPassword')}
            type="password"
            className="input-field"
            placeholder="Repeat your new password"
            autoComplete="new-password"
          />
          {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={resetPassword.isPending}
          className="btn-primary w-full"
        >
          {resetPassword.isPending ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  );
}
