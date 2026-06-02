import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthLayout from '../components/AuthLayout';
import { useForgotPassword } from '../hooks/useAuth';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    forgotPassword.mutate(data.email, {
      onSuccess: () => setSubmitted(true),
    });
  };

  if (submitted) {
    return (
      <AuthLayout title="Check your email" subtitle="A reset link is on the way">
        <div className="alert-success text-center">
          <p className="text-2xl mb-2">📬</p>
          <p className="font-semibold">Reset link sent!</p>
          <p className="text-sm mt-1 text-green-700">
            If that email address is registered, you'll receive a link to reset your password within a few minutes.
          </p>
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">
          <Link to="/login" className="text-blue-700 font-medium hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send a reset link">
      {forgotPassword.error && (
        <div className="alert-error mb-4">
          Something went wrong. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="form-label">Email address</label>
          <input
            {...register('email')}
            type="email"
            className="input-field"
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={forgotPassword.isPending}
          className="btn-primary w-full"
        >
          {forgotPassword.isPending ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        <Link to="/login" className="text-blue-700 font-medium hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
