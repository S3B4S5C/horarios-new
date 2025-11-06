// src/app/sustituciones/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { listCalendarios } from '@/services/scheduling';
import { listAsignaturas, listGrupos } from '@/services/academics';
import { listDocentes } from '@/services/users';
import { listClasesCalendario, setSubstituto, ClasePreview } from '@/services/substitucion';
import { Grupo } from '@/types';
type Calendario = { id: number; periodo: number; nombre?: string };
type Asignatura = { id: number; codigo: string; nombre: string };
type Docente = { id: number; nombre_completo: string };

function diaNombre(n?: number) {
  return n === 1 ? 'Lunes'
    : n === 2 ? 'Martes'
    : n === 3 ? 'Miércoles'
    : n === 4 ? 'Jueves'
    : n === 5 ? 'Viernes'
    : n === 6 ? 'Sábado'
    : n === 7 ? 'Domingo'
    : '—';
}

export default function SustitucionesPage() {
  // data
  const [cals, setCals] = useState<Calendario[]>([]);
  const [asigs, setAsigs] = useState<Asignatura[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);

  // filters
  const [calendario, setCalendario] = useState<number|''>('');
  const [docenteFilter, setDocenteFilter] = useState<number|''>('');
  const [hasSubFilter, setHasSubFilter] = useState<string>(''); // '', '1', '0'
  const [asignatura, setAsignatura] = useState<number|''>('');
  const [grupo, setGrupo] = useState<number|''>('');

  // listing
  const [clases, setClases] = useState<ClasePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number|null>(null);
  const [error, setError] = useState<string|undefined>();

  // local pending changes for substituto
  const [pending, setPending] = useState<Record<number, number|null>>({});

  // maps
  const asigById = useMemo(()=> {
    const m = new Map<number, Asignatura>();
    asigs.forEach(a=>m.set(a.id,a));
    return m;
  }, [asigs]);

  const grupoById = useMemo(()=> {
    const m = new Map<number, Grupo>();
    grupos.forEach(g=>m.set(g.id ?? 0, g));
    return m;
  }, [grupos]);

  const docenteById = useMemo(()=> {
    const m = new Map<number, Docente>();
    docentes.forEach(d=>m.set(d.id,d));
    return m;
  }, [docentes]);

  // initial loads
  useEffect(() => {
    listCalendarios().then(setCals);
    listAsignaturas().then(setAsigs);
    listDocentes().then(setDocentes);
  }, []);

  // load grupos (dependiendo de asignatura)
  useEffect(() => {
    const params: any = {};
    if (asignatura) params.asignatura_id = asignatura;
    listGrupos(params).then(setGrupos);
  }, [asignatura]);

  async function loadClases() {
    if (!calendario) { setClases([]); return; }
    setLoading(true); setError(undefined);
    try {
      const params: any = { calendario };
      if (docenteFilter) params.docente = docenteFilter;
      if (hasSubFilter !== '') params.has_substituto = hasSubFilter === '1';
      if (grupo) params.grupo = grupo;
      if (asignatura) params.asignatura = asignatura;
      const data = await listClasesCalendario(params);
      setClases(data);
      setPending({});
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Error al cargar clases');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendario, docenteFilter, hasSubFilter, asignatura, grupo]);

  async function handleGuardar(claseId: number) {
    const newVal = Object.prototype.hasOwnProperty.call(pending, claseId)
      ? pending[claseId]
      : clases.find(c=>c.id===claseId)?.docente_substituto ?? null;
    setSavingId(claseId);
    try {
      const updated = await setSubstituto(claseId, newVal ?? null);
      setClases(prev => prev.map(c => c.id === claseId ? updated : c));
      setPending(prev => {
        const copy = { ...prev };
        delete copy[claseId];
        return copy;
      });
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'No se pudo guardar la sustitución');
    } finally {
      setSavingId(null);
    }
  }

  function optionDocenteLabel(did: number|null|undefined) {
    if (!did) return 'Ninguno';
    return docenteById.get(did)?.nombre_completo || `#${did}`;
    }

  return (
    <div className="container py-3">
      <h1 className="h4 mb-3">Sustituciones de Docente</h1>

      <div className="card mb-3">
        <div className="card-body">
          <form className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label">Calendario</label>
              <select className="form-select" value={calendario} onChange={e=>setCalendario(e.target.value ? Number(e.target.value) : '')}>
                <option value="">— seleccionar —</option>
                {cals.map(c=> <option key={c.id} value={c.id}>{c.nombre ?? `Cal ${c.id}`}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">Docente (titular o sustituto)</label>
              <select className="form-select" value={docenteFilter} onChange={e=>setDocenteFilter(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Todos</option>
                {docentes.map(d=> <option key={d.id} value={d.id}>{d.nombre_completo}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">¿Tiene sustituto?</label>
              <select className="form-select" value={hasSubFilter} onChange={e=>setHasSubFilter(e.target.value)}>
                <option value="">Todos</option>
                <option value="1">Sí</option>
                <option value="0">No</option>
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">Asignatura</label>
              <select className="form-select" value={asignatura} onChange={e=>setAsignatura(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Todas</option>
                {asigs.map(a=> <option key={a.id} value={a.id}>{a.codigo} · {a.nombre}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">Grupo</label>
              <select className="form-select" value={grupo} onChange={e=>setGrupo(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Todos</option>
                {grupos.map(g=> {
                  const asig = asigById.get(g.asignatura);
                  return <option key={g.id} value={g.id}>{asig?.codigo ?? '—'}-{g.codigo ?? g.id}</option>;
                })}
              </select>
            </div>
          </form>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h2 className="h6 mb-0">Clases</h2>
            <button className="btn btn-sm btn-outline-secondary" onClick={loadClases} disabled={loading || !calendario}>
              {loading ? 'Actualizando…' : 'Refrescar'}
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Asignatura</th>
                  <th>Grupo</th>
                  <th>Tipo</th>
                  <th>Día</th>
                  <th>Bloque</th>
                  <th>Titular</th>
                  <th>Sustituto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clases.map(c => {
                  const g = grupoById.get(c.grupo);
                  const a = g ? asigById.get(g.asignatura) : undefined;
                  const titular = c.docente ? docenteById.get(c.docente)?.nombre_completo : '—';
                  const current = Object.prototype.hasOwnProperty.call(pending, c.id)
                    ? pending[c.id]
                    : (c.docente_substituto ?? null);

                  return (
                    <tr key={c.id}>
                      <td>{a ? `${a.codigo} · ${a.nombre}` : '—'}</td>
                      <td>{g?.codigo ?? `#${c.grupo}`}</td>
                      <td>{c.tipo === 'T' ? 'Teoría' : 'Práctica'}</td>
                      <td>{diaNombre(c.day_of_week)}</td>
                      <td>#{c.bloque_inicio} ×{c.bloques_duracion}</td>
                      <td>{titular}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          style={{ minWidth: 240 }}
                          value={current ?? ''}
                          onChange={e => {
                            const v = e.target.value ? Number(e.target.value) : null;
                            setPending(prev => ({ ...prev, [c.id]: v }));
                          }}
                        >
                          <option value="">— Ninguno —</option>
                          {docentes.map(d => (
                            <option key={d.id} value={d.id}>{d.nombre_completo}</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleGuardar(c.id)}
                          disabled={savingId === c.id}
                        >
                          {savingId === c.id ? 'Guardando…' : 'Guardar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {clases.length === 0 && (
              <p className="text-muted small mb-0">Sin resultados para los filtros.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
