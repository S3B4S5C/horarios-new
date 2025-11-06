'use client';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MENU_ITEMS } from '@/lib/menu';
import { http } from '@/lib/http';

export default function Sidebar() {
  const { role, logout, user } = useAuth();
  const [unread, setUnread] = useState<number>(0);

  const fetchUnread = useCallback(async () => {
    try {
      const { data } = await http.get('/api/notifications/', { params: { unread: true } });
      setUnread(Array.isArray(data) ? data.length : 0);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    fetchUnread();
    const handler = () => fetchUnread();
    window.addEventListener('notifications:updated', handler as EventListener);
    return () => window.removeEventListener('notifications:updated', handler as EventListener);
  }, [fetchUnread]);

  const items = MENU_ITEMS.filter(i => (role ? i.roles.includes(role) : false));

  return (
    <aside className="d-flex flex-column gap-2 p-3 border-end h-100 position-sticky" style={{ top: 0, minWidth: 260 }}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="fw-semibold">UNO Horarios</div>

        {/* Botón -> Link a notificaciones */}
        <Link
          href="/notifications"
          className="btn btn-outline-secondary btn-sm position-relative"
          title="Notificaciones"
        >
          <i className="bi bi-bell"></i>
          {unread > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>
      </div>

      <div className="text-muted small mb-2">
        {user ? <>Conectado como <span className="fw-semibold">{user.username}</span> · <span className="badge text-bg-light">{user.profile.role}</span></> : 'No autenticado'}
      </div>

      <nav className="nav nav-pills flex-column">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="nav-link">{i.label}</Link>
        ))}
      </nav>

      <div className="mt-auto pt-2 border-top">
        <button className="btn btn-outline-danger w-100" onClick={logout}>Cerrar sesión</button>
      </div>
    </aside>
  );
}
