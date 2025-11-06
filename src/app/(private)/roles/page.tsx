'use client';
import { useEffect, useState } from 'react';
import { useRoleGuard } from '@/lib/role-guard';
import type { UserRole } from '@/types';
import { assignRole } from '@/services/users';
import { listUsersBasic } from '@/services/users';

const ROLES: UserRole[] = ['JEFE_CARRERA','VICERRECTORADO','RECTOR','DOCENTE','ESTUDIANTE'];

export default function RolesPage() {
  useRoleGuard(['JEFE_CARRERA','VICERRECTORADO','RECTOR']);

  const [users, setUsers] = useState<{id:number;username:string;email?:string}[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | ''>('');
  const [role, setRole] = useState<UserRole>('DOCENTE');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await listUsersBasic(); // requiere endpoint
        setUsers(data);
        setUsersError(null);
      } catch {
        setUsersError('Falta un endpoint para listar usuarios (ej. GET /api/users/).');
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true); setMsg(null);
    try {
      await assignRole({ user_id: Number(userId), role });
      setMsg('Rol asignado correctamente.');
    } catch {
      setMsg('No se pudo asignar el rol.');
    } finally { setSaving(false); }
  }

  return (
    <div className="d-grid gap-3">
      <h1 className="h4">Asignación de roles</h1>

      <form className="row gy-3" onSubmit={onSubmit}>
        <div className="col-12 col-md-6">
          <label className="form-label">Usuario</label>
          <select
            className="form-select"
            value={userId}
            onChange={(e)=>setUserId(e.target.value ? Number(e.target.value) : '')}
            disabled={loadingUsers || !!usersError}
          >
            <option value="">Selecciona…</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.username}{u.email ? ` · ${u.email}` : ''}
              </option>
            ))}
          </select>
          {usersError && <div className="form-text text-danger">{usersError}</div>}
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label">Rol</label>
          <select className="form-select" value={role} onChange={(e)=>setRole(e.target.value as UserRole)}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="col-12 col-md-2 d-flex align-items-end">
          <button className="btn btn-primary w-100" disabled={saving || !!usersError || !userId}>
            Guardar
          </button>
        </div>
      </form>

      {msg && <div className="alert alert-info py-2">{msg}</div>}
    </div>
  );
}
