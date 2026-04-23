import axios from 'axios';
import { toast } from 'react-toastify';

/** Backend origin without `/api` (same host the browser uses for REST and `/uploads`). */
export function getBackendPublicOrigin() {
  const base = process.env.REACT_APP_API_URL;
  if (base && String(base).trim()) {
    return String(base).replace(/\/+$/, '');
  }
  return 'http://localhost:8080';
}

/** Prefix relative `/uploads/...` paths with the configured backend origin for production. */
export function resolveMediaUrl(url) {
  if (url == null || typeof url !== 'string') return url;
  const u = url.trim();
  if (!u) return url;
  if (u.startsWith('data:') || /^https?:\/\//i.test(u)) return u;
  if (u.startsWith('/uploads/')) {
    return `${getBackendPublicOrigin()}${u}`;
  }
  return u;
}

const api = axios.create({
  baseURL: `${getBackendPublicOrigin()}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isUnreadCountRequest = requestUrl.includes('/notifications/my/unread-count');

    if (status === 403) {
      if (isUnreadCountRequest) return Promise.reject(error);
      toast.error('You are not authorized to access this resource');
    } else if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      if (!isUnreadCountRequest) window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
