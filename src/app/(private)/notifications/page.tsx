'use client';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import {
  listNotifications,
  markNotificationRead,
  type NotificationItem,
} from '@/services/notifications';

dayjs.extend(relativeTime);
dayjs.locale('es');

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(forceUnread = onlyUnread) {
    setLoading(true);
    setError(null);
    try {
      const data = await listNotifications(forceUnread ? { unread: true } : undefined);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar las notificaciones.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    load(onlyUnread);
  }, [onlyUnread]);

  const unreadCount = useMemo(() => items.filter(i => !i.leida).length, [items]);

  async function onMarkRead(id: number) {
    try {
      await markNotificationRead(id);
      setItems(prev => prev.map(it => (it.id === id ? { ...it, leida: true } : it)));
      window.dispatchEvent(new CustomEvent('notifications:updated'));
    } catch {
    }
  }

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 mb-0">
          Notificaciones {unreadCount > 0 && <span className="badge text-bg-danger ms-2">{unreadCount}</span>}
        </h1>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="onlyUnread"
            checked={onlyUnread}
            onChange={(e) => setOnlyUnread(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="onlyUnread">Solo no leídas</label>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="text-muted">Cargando…</div>}

      {!loading && items.length === 0 && (
        <div className="alert alert-light border">
          No tienes notificaciones {onlyUnread ? 'no leídas' : ''}.
        </div>
      )}

      <div className="list-group">
        {items.map((n) => (
          <div
            key={n.id}
            className={`list-group-item list-group-item-action py-3 ${n.leida ? '' : 'list-group-item-warning'}`}
          >
            <div className="d-flex w-100 justify-content-between">
              <h6 className="mb-1">
                {!n.leida && <span className="badge rounded-pill bg-danger me-2">•</span>}
                {n.titulo}
              </h6>
              <small className="text-muted" title={dayjs(n.creada_en).format('DD/MM/YYYY HH:mm')}>
                {dayjs(n.creada_en).fromNow()}
              </small>
            </div>
            <p className="mb-2">{n.mensaje}</p>

            <div className="d-flex gap-2">
              {!n.leida ? (
                <button className="btn btn-sm btn-outline-primary" onClick={() => onMarkRead(n.id)}>
                  Marcar como leída
                </button>
              ) : (
                <span className="badge text-bg-secondary">Leída</span>
              )}
              {typeof n.clase === 'number' && (
                <span className="badge text-bg-light">Clase #{n.clase}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
