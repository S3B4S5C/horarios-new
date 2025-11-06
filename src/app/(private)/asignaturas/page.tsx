'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRoleGuard } from '@/lib/role-guard';
import { listAsignaturas, createAsignatura, patchAsignatura, deleteAsignatura } from '@/services/asignaturas';
import { listTiposAmbiente } from '@/services/facilities';
import { listCarreras } from '@/services/facilities';
import type { Asignatura } from '@/types';

export default function AsignaturasPage() {
  useRoleGuard(['JEFE_CARRERA','VICERRECTORADO','RECTOR']);

  const [items, setItems] = useState<Asignatura[]>([]);
  const [tipos, setTipos] = useState<{id:number;nombre:string}[]>([]);
  const [carreras, setCarreras] = useState<{id:number;sigla:string;nombre:string}[]>([]);
  const [carrerasErr, setCarrerasErr] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Asignatura | null>(null);

  const [crear, setCrear] = useState({
    carrera: '' as number | '',
    codigo: '',
    nombre: '',
    horas_teoria_semana: 0,
    horas_practica_semana: 0,
    tipo_ambiente_teoria: '' as number | '' | null,
    tipo_ambiente_practica: '' as number | '' | null,
  });
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  async function load() {
    const [asig] = await Promise.all([
      listAsignaturas(),
    ]);
    setItems(asig);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await listTiposAmbiente();
        setTipos(data);
      } catch { /* noop */ }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await listCarreras(); // requiere endpoint
        setCarreras(data);
        setCarrerasErr(null);
      } catch {
        setCarrerasErr('Falta un endpoint para listar carreras (ej. GET /api/academics/carreras/).');
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(a =>
      a.codigo.toLowerCase().includes(s) ||
      a.nombre.toLowerCase().includes(s)
    );
  }, [q, items]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!crear.carrera) return;
    setSavingCreate(true);
    try {
      await createAsignatura({
        carrera: Number(crear.carrera),
        codigo: crear.codigo,
        nombre: crear.nombre,
        horas_teoria_semana: Number(crear.horas_teoria_semana) || 0,
        horas_practica_semana: Number(crear.horas_practica_semana) || 0,
        tipo_ambiente_teoria: crear.tipo_ambiente_teoria ? Number(crear.tipo_ambiente_teoria) : null,
        tipo_ambiente_practica: crear.tipo_ambiente_practica ? Number(crear.tipo_ambiente_practica) : null,
      });
      setCrear({ carrera:'', codigo:'', nombre:'', horas_teoria_semana:0, horas_practica_semana:0, tipo_ambiente_teoria:'', tipo_ambiente_practica:'' });
      await load();
    } catch { /* noop */ }
    finally { setSavingCreate(false); }
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setSavingEdit(true);
    try {
      await patchAsignatura(edit.id, {
        codigo: edit.codigo,
        nombre: edit.nombre,
        horas_teoria_semana: edit.horas_teoria_semana,
        horas_practica_semana: edit.horas_practica_semana,
        tipo_ambiente_teoria: edit.tipo_ambiente_teoria ?? null,
        tipo_ambiente_practica: edit.tipo_ambiente_practica ?? null,
      });
      setEdit(null);
      await load();
    } catch { /* noop */ }
    finally { setSavingEdit(false); }
  }

  async function onDelete(id: number) {
    if (!confirm('¿Eliminar asignatura?')) return;
    try { await deleteAsignatura(id); await load(); } catch { /* noop */ }
  }

  return (
    <div className="d-grid gap-4">
      <div className="d-flex align-items-center justify-content-between">
        <h1 className="h4 mb-0">Asignaturas</h1>
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
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>H T</th>
                  <th>H P</th>
                  <th>Amb T</th>
                  <th>Amb P</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7}>Cargando…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}>Sin resultados</td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id}>
                    <td>{a.codigo}</td>
                    <td>{a.nombre}</td>
                    <td>{a.horas_teoria_semana ?? 0}</td>
                    <td>{a.horas_practica_semana ?? 0}</td>
                    <td>{tipos.find(t=>t.id===a.tipo_ambiente_teoria)?.nombre || '-'}</td>
                    <td>{tipos.find(t=>t.id===a.tipo_ambiente_practica)?.nombre || '-'}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-primary" onClick={()=>setEdit(a)}>Editar</button>
                        <button className="btn btn-outline-danger" onClick={()=>onDelete(a.id)}>Eliminar</button>
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
              <h2 className="h6">Nueva asignatura</h2>
              <form className="d-grid gap-2" onSubmit={onCreate}>
                <div className="row g-2">
                  <div className="col-12">
                    <label className="form-label">Carrera</label>
                    <select className="form-select"
                      value={crear.carrera}
                      onChange={(e)=>setCrear({...crear, carrera: e.target.value ? Number(e.target.value) : ''})}
                      disabled={!!carrerasErr}
                      required
                    >
                      <option value="">Selecciona…</option>
                      {carreras.map(c => <option key={c.id} value={c.id}>{c.sigla} · {c.nombre}</option>)}
                    </select>
                    {carrerasErr && <div className="form-text text-danger">{carrerasErr}</div>}
                  </div>
                </div>
                <input className="form-control" placeholder="Código" value={crear.codigo} onChange={(e)=>setCrear({...crear, codigo:e.target.value})} required />
                <input className="form-control" placeholder="Nombre" value={crear.nombre} onChange={(e)=>setCrear({...crear, nombre:e.target.value})} required />
                <div className="row g-2">
                  <div className="col"><input className="form-control" type="number" min={0} placeholder="Horas T/sem" value={crear.horas_teoria_semana} onChange={(e)=>setCrear({...crear, horas_teoria_semana:Number(e.target.value)})} /></div>
                  <div className="col"><input className="form-control" type="number" min={0} placeholder="Horas P/sem" value={crear.horas_practica_semana} onChange={(e)=>setCrear({...crear, horas_practica_semana:Number(e.target.value)})} /></div>
                </div>
                <div className="row g-2">
                  <div className="col">
                    <select className="form-select"
                      value={crear.tipo_ambiente_teoria || ''}
                      onChange={(e)=>setCrear({...crear, tipo_ambiente_teoria: e.target.value ? Number(e.target.value) : ''})}
                    >
                      <option value="">Tipo ambiente teoría (opcional)</option>
                      {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>
                  <div className="col">
                    <select className="form-select"
                      value={crear.tipo_ambiente_practica || ''}
                      onChange={(e)=>setCrear({...crear, tipo_ambiente_practica: e.target.value ? Number(e.target.value) : ''})}
                    >
                      <option value="">Tipo ambiente práctica (opcional)</option>
                      {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary" disabled={!!carrerasErr || savingCreate}>{savingCreate ? 'Creando…' : 'Crear'}</button>
              </form>
            </div>
          </div>

          {edit && (
            <div className="card mt-4">
              <div className="card-body">
                <h2 className="h6">Editar asignatura</h2>
                <form className="d-grid gap-2" onSubmit={onSaveEdit}>
                  <input className="form-control" value={edit.codigo} onChange={(e)=>setEdit({...edit, codigo:e.target.value})} />
                  <input className="form-control" value={edit.nombre} onChange={(e)=>setEdit({...edit, nombre:e.target.value})} />
                  <div className="row g-2">
                    <div className="col"><input className="form-control" type="number" min={0} value={edit.horas_teoria_semana ?? 0} onChange={(e)=>setEdit({...edit, horas_teoria_semana:Number(e.target.value)})} /></div>
                    <div className="col"><input className="form-control" type="number" min={0} value={edit.horas_practica_semana ?? 0} onChange={(e)=>setEdit({...edit, horas_practica_semana:Number(e.target.value)})} /></div>
                  </div>
                  <div className="row g-2">
                    <div className="col">
                      <select className="form-select"
                        value={edit.tipo_ambiente_teoria ?? ''}
                        onChange={(e)=>setEdit({...edit, tipo_ambiente_teoria: e.target.value ? Number(e.target.value) : null})}
                      >
                        <option value="">Tipo ambiente teoría</option>
                        {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                      </select>
                    </div>
                    <div className="col">
                      <select className="form-select"
                        value={edit.tipo_ambiente_practica ?? ''}
                        onChange={(e)=>setEdit({...edit, tipo_ambiente_practica: e.target.value ? Number(e.target.value) : null})}
                      >
                        <option value="">Tipo ambiente práctica</option>
                        {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                      </select>
                    </div>
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
