'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
    else router.replace('/login');
  }, [isAuthenticated, router]);

  return (
    <div className="d-flex vh-100 align-items-center justify-content-center">
      <div className="text-center">
        <div className="spinner-border" role="status" aria-label="Cargando..." />
        <p className="mt-3 text-muted">Cargando…</p>
      </div>
    </div>
  );
}