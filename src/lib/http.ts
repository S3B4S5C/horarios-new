import axios from 'axios';
import { readTokens, clearSession } from './auth-storage';

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const tokens = readTokens();
  if (tokens?.access) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 423) {
      // 401: credenciales inválidas / token expirado
      // 423: cuenta/IP bloqueada por intentos fallidos (según tu OpenAPI)
      clearSession();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);