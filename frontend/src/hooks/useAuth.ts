import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; userType: string };
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterPayload) =>
      api.post('/api/auth/register-resident', data).then((r) => r.data),
  });
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginPayload) =>
      api.post<LoginResponse>('/api/auth/login', data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  return () => {
    clearAuth();
    navigate('/login');
  };
}
