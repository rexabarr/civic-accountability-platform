import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegisterStaff } from '../hooks/useStaff';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required').refine(
    (e) => {
      const domain = e.toLowerCase().split('@')[1] ?? '';
      return ['.gov', '.state.pa.us', '.edu'].some((d) => domain.endsWith(d));
    },
    'Must be a government email (.gov, .state.pa.us)',
  ),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  departmentName: z.string().optional(),
  role: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function StaffRegisterPage() {
  const navigate = useNavigate();
  const register = useRegisterStaff();
  const [submitted, setSubmitted] = useState(false);

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    await register.mutateAsync({
      name: data.name,
      email: data.email,
      password: data.password,
      departmentName: data.departmentName || undefined,
      role: data.role || undefined,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full card text-center space-y-4">
          <div className="text-5xl">🏛️</div>
          <h2 className="text-2xl font-bold text-gray-900">Registration Submitted</h2>
          <p className="text-gray-600">
            Your staff account is pending admin approval. You'll receive confirmation once your
            account is verified. This typically takes 1–2 business days.
          </p>
          <Link to="/login" className="btn-primary inline-block mt-2">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Staff / Rep Portal Registration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Government email required · Account pending admin approval
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div>
            <label className="label">Full name</label>
            <input {...field('name')} className="input-field" placeholder="Jane Smith" />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Government email</label>
            <input
              {...field('email')}
              type="email"
              className="input-field"
              placeholder="j.smith@phila.gov"
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <input {...field('password')} type="password" className="input-field" />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <div>
            <label className="label">Department (optional)</label>
            <input
              {...field('departmentName')}
              className="input-field"
              placeholder="e.g. Streets Department"
            />
          </div>

          <div>
            <label className="label">Role / Title (optional)</label>
            <input
              {...field('role')}
              className="input-field"
              placeholder="e.g. Constituent Services Director"
            />
          </div>

          {register.error && (
            <div className="alert-error text-sm">
              {(register.error as { response?: { data?: { error?: string } } }).response?.data
                ?.error ?? 'Registration failed. Please try again.'}
            </div>
          )}

          <button type="submit" disabled={register.isPending} className="btn-primary w-full">
            {register.isPending ? 'Submitting…' : 'Request Staff Access'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
