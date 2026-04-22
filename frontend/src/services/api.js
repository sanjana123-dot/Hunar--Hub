import axios from 'axios';
import { toast } from 'react-toastify';

// ✅ Use env variable in production, fallback to localhost for development
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL}/api` 
    : 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isUnreadCountRequest = requestUrl.includes('/notifications/my/unread-count');

    if (status === 403) {
      if (isUnreadCountRequest) {
        return Promise.reject(error);
      }
      toast.error('You are not authorized to access this resource');
    } else if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      if (!isUnreadCountRequest) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
