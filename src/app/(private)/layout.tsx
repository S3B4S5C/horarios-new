'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="d-flex vh-100 align-items-center justify-content-center">
        <div className="spinner-border" role="status" aria-label="Cargando..." />
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row" style={{ minHeight: '100vh' }}>
        <div className="col-12 col-md-3 col-lg-2 p-0">
          <Sidebar />
        </div>
        <main className="col-12 col-md-9 col-lg-10 p-4">{children}</main>
      </div>
    </div>
  );
}
