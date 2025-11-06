'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRoleGuard } from '@/lib/role-guard';
import { listDocentes, registerDocente, updateDocente, deleteDocente } from '@/services/users';
import type { Docente } from '@/types';

export default function DocentesPage() {
  useRoleGuard(['JEFE_CARRERA','VICERRECTORADO']);

  const [items, setItems] = useState<Docente[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [edit, setEdit] = useState<Docente | null>(null);

  const [reg, setReg] = useState({ username:'', email:'', password:'', nombre_completo:'', especialidad:'' });
  const [savingReg, setSavingReg] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  async function load() {
    try {
      const data = await listDocentes();
      setItems(data);
      setErr(null);
    } catch { setErr('No se pudo cargar la lista.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(d =>
      d.nombre_completo.toLowerCase().includes(s) ||
      (d.especialidad || '').toLowerCase().includes(s)
    );
  }, [q, items]);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setSavingReg(true);
    try {
      await registerDocente(reg);
      setReg({ username:'', email:'', password:'', nombre_completo:'', especialidad:'' });
      await load();
    } catch { /* noop */ }
    finally { setSavingReg(false); }
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setSavingEdit(true);
    try {
      await updateDocente(edit.id, {
        nombre_completo: edit.nombre_completo,
        especialidad: edit.especialidad,
        carga_min_semanal: edit.carga_min_semanal,
        carga_max_semanal: edit.carga_max_semanal,
        activo: edit.activo,
      });
      setEdit(null);
      await load();
    } catch { /* noop */ }
    finally { setSavingEdit(false); }
  }

  async function onDelete(id: number) {
    if (!confirm('¿Eliminar docente?')) return;
    try { await deleteDocente(id); await load(); } catch { /* noop */ }
  }

  return (
    <div className="d-grid gap-4">
      <div className="d-flex align-items-center justify-content-between">
        <h1 className="h4 mb-0">Docentes</h1>
        <div className="ms-auto" style={{maxWidth: 280}}>
          <input className="form-control" placeholder="Buscar…" value={q} onChange={(e)=>setQ(e.target.value)} />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Especialidad</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Activo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6}>Cargando…</td></tr>
                ) : err ? (
                  <tr><td colSpan={6} className="text-danger">{err}</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6}>Sin resultados</td></tr>
                ) : filtered.map(d => (
                  <tr key={d.id}>
                    <td>{d.nombre_completo}</td>
                    <td>{d.especialidad || '-'}</td>
                    <td>{d.carga_min_semanal ?? 0}</td>
                    <td>{d.carga_max_semanal ?? 0}</td>
                    <td>{d.activo ? 'Sí' : 'No'}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-primary" onClick={()=>setEdit(d)}>Editar</button>
                        <button className="btn btn-outline-danger" onClick={()=>onDelete(d.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card">
            <div className="card-body">
              <h2 className="h6">Registrar nuevo docente</h2>
              <form className="d-grid gap-2" onSubmit={onRegister}>
                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <input className="form-control" placeholder="Usuario" value={reg.username} onChange={(e)=>setReg({...reg, username:e.target.value})} required />
                  </div>
                  <div className="col-12 col-md-6">
                    <input className="form-control" placeholder="Email" type="email" value={reg.email} onChange={(e)=>setReg({...reg, email:e.target.value})} required />
                  </div>
                </div>
                <input className="form-control" placeholder="Nombre completo" value={reg.nombre_completo} onChange={(e)=>setReg({...reg, nombre_completo:e.target.value})} required />
                <input className="form-control" placeholder="Especialidad (opcional)" value={reg.especialidad} onChange={(e)=>setReg({...reg, especialidad:e.target.value})} />
                <input className="form-control" placeholder="Contraseña" type="password" value={reg.password} onChange={(e)=>setReg({...reg, password:e.target.value})} required />
                <button className="btn btn-primary" disabled={savingReg}>{savingReg ? 'Guardando…' : 'Crear'}</button>
              </form>
            </div>
          </div>

          {edit && (
            <div className="card mt-4">
              <div className="card-body">
                <h2 className="h6">Editar docente</h2>
                <form className="d-grid gap-2" onSubmit={onSaveEdit}>
                  <input className="form-control" value={edit.nombre_completo} onChange={(e)=>setEdit({...edit, nombre_completo:e.target.value})} />
                  <input className="form-control" placeholder="Especialidad" value={edit.especialidad || ''} onChange={(e)=>setEdit({...edit, especialidad:e.target.value})} />
                  <div className="row g-2">
                    <div className="col"><input className="form-control" type="number" min={0} placeholder="Mín." value={edit.carga_min_semanal ?? 0} onChange={(e)=>setEdit({...edit, carga_min_semanal:Number(e.target.value)})} /></div>
                    <div className="col"><input className="form-control" type="number" min={0} placeholder="Máx." value={edit.carga_max_semanal ?? 0} onChange={(e)=>setEdit({...edit, carga_max_semanal:Number(e.target.value)})} /></div>
                  </div>
                  <div className="form-check">
                    <input id="act" className="form-check-input" type="checkbox" checked={!!edit.activo} onChange={(e)=>setEdit({...edit, activo:e.target.checked})} />
                    <label htmlFor="act" className="form-check-label">Activo</label>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary" disabled={savingEdit}>{savingEdit ? 'Guardando…' : 'Guardar'}</button>
                    <button type="button" className="btn btn-outline-secondary" onClick={()=>setEdit(null)}>Cancelar</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
