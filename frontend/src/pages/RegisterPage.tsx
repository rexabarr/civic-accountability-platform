import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthLayout from '../components/AuthLayout';
import { useRegister } from '../hooks/useAuth';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [success, setSuccess] = useState(false);
  const register = useRegister();

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    register.mutate(
      { email: data.email, password: data.password, name: data.name },
      { onSuccess: () => setSuccess(true) },
    );
  };

  if (success) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent you a verification link">
        <div className="alert-success">
          <p className="font-medium">Registration successful!</p>
          <p className="text-sm mt-1">
            Check the backend console for your verification link (mock email mode).
          </p>
        </div>
        <Link to="/login" className="btn-primary block text-center mt-4">
          Go to Login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create account" subtitle="Join the civic accountability platform">
      {register.error && (
        <div className="alert-error mb-4">
          {(register.error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            'Registration failed. Please try again.'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="form-label">Full name</label>
          <input {...field('name')} className="input-field" placeholder="Jane Smith" />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>

        <div>
          <label className="form-label">Email address</label>
          <input
            {...field('email')}
            type="email"
            className="input-field"
            placeholder="you@example.com"
          />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <div>
          <label className="form-label">Password</label>
          <input
            {...field('password')}
            type="password"
            className="input-field"
            placeholder="At least 8 characters"
          />
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>

        <div>
          <label className="form-label">Confirm password</label>
          <input {...field('confirmPassword')} type="password" className="input-field" />
          {errors.confirmPassword && (
            <p className="form-error">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={register.isPending}
          className="btn-primary w-full"
        >
          {register.isPending ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-700 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
