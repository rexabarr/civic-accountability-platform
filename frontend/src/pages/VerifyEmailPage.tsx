import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import api from '../utils/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const alreadyVerified = searchParams.get('verified') === 'true';
  const hasError = searchParams.get('error');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    alreadyVerified ? 'success' : hasError ? 'error' : 'loading',
  );
  const [message, setMessage] = useState(
    alreadyVerified ? 'Email verified successfully' : hasError ? 'Invalid or expired link.' : '',
  );

  useEffect(() => {
    if (alreadyVerified || hasError || !token) {
      if (!token && !alreadyVerified && !hasError) {
        setStatus('error');
        setMessage('No verification token found in URL.');
      }
      return;
    }

    api
      .get(`/api/auth/verify-email/${token}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(
          err.response?.data?.error ?? 'Verification failed. The link may have expired.',
        );
      });
  }, [token, alreadyVerified, hasError]);

  return (
    <AuthLayout title="Email Verification">
      {status === 'loading' && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      )}

      {status === 'success' && (
        <div>
          <div className="alert-success mb-4">
            <p className="font-medium">Email verified!</p>
            <p className="text-sm mt-1">{message}</p>
          </div>
          <Link to="/login" className="btn-primary block text-center">
            Sign in to your account
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div className="alert-error mb-4">
            <p className="font-medium">Verification failed</p>
            <p className="text-sm mt-1">{message}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/register" className="btn-secondary flex-1 text-center">
              Register again
            </Link>
            <Link to="/login" className="btn-primary flex-1 text-center">
              Sign in
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
