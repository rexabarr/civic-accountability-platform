import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthLayout from '../components/AuthLayout';
import { useLogin } from '../hooks/useAuth';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    login.mutate(data);
  };

  return (
    <AuthLayout title="Sign in" subtitle="Access your account">
      {login.error && (
        <div className="alert-error mb-4">
          {(login.error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            'Login failed. Please check your credentials.'}
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

        <div>
          <label className="form-label">Password</label>
          <input
            {...register('password')}
            type="password"
            className="input-field"
            placeholder="Your password"
            autoComplete="current-password"
          />
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={login.isPending}
          className="btn-primary w-full"
        >
          {login.isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-blue-700 font-medium hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
