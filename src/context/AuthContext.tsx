'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { http } from '@/lib/http';
import { saveSession, readTokens, readUser, clearSession } from '@/lib/auth-storage';
import type { AuthResponse, LoginRequest, User } from '@/types/';

type AuthCtx = {
  user: User | null;
  role: User['profile']['role'] | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const u = readUser<User>();
    if (u) setUser(u);
  }, []);

  async function login(identifier: string, password: string) {
    const body: LoginRequest =
      identifier.includes('@') ? { email: identifier, password } : { username: identifier, password };
    const { data } = await http.post<AuthResponse>('/api/users/login/', body, {
      headers: { 'Content-Type': 'application/json' },
    });
    saveSession(data.tokens, data.user);
    setUser(data.user);
    router.replace('/dashboard');
  }

  function logout() {
    clearSession();
    setUser(null);
    router.replace('/login');
  }

  const role = user?.profile?.role ?? null;
  const isAuthenticated = !!readTokens()?.access && !!user;

  const value = useMemo(() => ({ user, role, login, logout, isAuthenticated }), [user, role, isAuthenticated]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}