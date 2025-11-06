import { http } from '@/lib/http';

export type NotificationItem = {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  creada_en: string; // ISO
  clase?: number | null;
};

// Lista (opcionalmente solo no leídas)
export async function listNotifications(params?: { unread?: boolean }) {
  const { data } = await http.get<NotificationItem[]>('/api/notifications/', {
    params,
  });
  return data ?? [];
}

// Marca una notificación como leída
export async function markNotificationRead(id: number) {
  const { data } = await http.post<NotificationItem>(
    `/api/notifications/${id}/read/`
  );
  return data;
}
