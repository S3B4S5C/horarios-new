import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useRoleGuard(allowed: UserRole[]) {
  const { role, isAuthenticated } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated) return;
    if (role && !allowed.includes(role)) router.replace('/dashboard');
  }, [role, isAuthenticated, allowed, router]);
}