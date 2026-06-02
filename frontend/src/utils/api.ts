import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Dev: empty baseURL → Vite proxy forwards /api/* to localhost:3000
// Prod: VITE_API_URL points to the Railway backend (e.g. https://myapp.railway.app)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(err);
  },
);

export default api;
