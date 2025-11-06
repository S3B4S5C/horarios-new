'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { http } from '@/lib/http';

type Periodo = {
  id: number;
  gestion: number;
  numero: 1 | 2 | number;
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string;    // YYYY-MM-DD
};

type Calendario = {
  id: number;
  periodo: number;
  nombre: string;
  duracion_bloque_min: number;
};

interface PeriodoFormProps {
  initial?: Partial<Periodo>;
  existentes: Periodo[];
  onSubmit: (payload: Omit<Periodo, 'id'>) => Promise<void>;
  onCancel?: () => void;
}
function PeriodoForm({ initial, existentes, onSubmit, onCancel }: PeriodoFormProps) {
  const [gestion, setGestion] = useState<number>(initial?.gestion ?? new Date().getFullYear());
  const [numero, setNumero]   = useState<number>(initial?.numero ?? 1);
  const [fi, setFi]           = useState<string>(initial?.fecha_inicio ?? '');
  const [ff, setFf]           = useState<string>(initial?.fecha_fin ?? '');
  const [error, setError]     = useState<string | undefined>();

  const duplicado = useMemo(
    () => existentes.some(p => p.gestion === gestion && p.numero === Number(numero) && p.id !== (initial?.id ?? -1)),
    [existentes, gestion, numero, initial?.id]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gestion || !numero || !fi || !ff) { setError('Todos los campos son obligatorios.'); return; }
    if (![1,2].includes(Number(numero))) { setError('El número de período debe ser 1 o 2.'); return; }
    if (fi > ff) { setError('La fecha de inicio no puede ser mayor que la fecha fin.'); return; }
    if (duplicado) { setError('Ya existe un período con esa gestión y número.'); return; }
    await onSubmit({ gestion: Number(gestion), numero: Number(numero) as 1|2, fecha_inicio: fi, fecha_fin: ff });
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
      <div className="row g-3">
        <div className="col-6 col-md-3">
          <label className="form-label">Gestión</label>
          <input type="number" min={2000} className="form-control"
            value={gestion} onChange={e=>setGestion(Number(e.target.value))}/>
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label">Número</label>
          <select className="form-select" value={numero} onChange={e=>setNumero(Number(e.target.value))}>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </div>
        <div className="col-12 col-md-3">
          <label className="form-label">Fecha inicio</label>
          <input type="date" className="form-control" value={fi} onChange={e=>setFi(e.target.value)} />
        </div>
        <div className="col-12 col-md-3">
          <label className="form-label">Fecha fin</label>
          <input type="date" className="form-control" value={ff} onChange={e=>setFf(e.target.value)} />
        </div>
      </div>
      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-primary" type="submit">Guardar</button>
        {onCancel && <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
}

interface CalendarioFormProps {
  initial?: Partial<Calendario>;
  existentes: Calendario[];
  periodos: Periodo[];
  onSubmit: (payload: Omit<Calendario, 'id'>) => Promise<void>;
  onCancel?: () => void;
}
function CalendarioForm({ initial, existentes, periodos, onSubmit, onCancel }: CalendarioFormProps) {
  const [periodo, setPeriodo] = useState<number>(initial?.periodo ?? (periodos[0]?.id ?? 0));
  const [nombre, setNombre]   = useState<string>(initial?.nombre ?? 'Calendario');
  const [duracion, setDur]    = useState<number>(initial?.duracion_bloque_min ?? 45);
  const [error, setError]     = useState<string | undefined>();

  const periodoInfo = useMemo(() => periodos.find(p=>p.id===periodo), [periodos, periodo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!periodo || !nombre || !duracion) { setError('Todos los campos son obligatorios.'); return; }
    if (duracion <= 0) { setError('La duración del bloque debe ser > 0.'); return; }
    await onSubmit({ periodo, nombre: nombre.trim(), duracion_bloque_min: Number(duracion) });
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <label className="form-label">Período</label>
          <select className="form-select" value={periodo} onChange={e=>setPeriodo(Number(e.target.value))}>
            {periodos.map(p=> <option key={p.id} value={p.id}>{p.gestion}/{p.numero}</option>)}
          </select>
          {periodoInfo && <div className="form-text">Del {periodoInfo.fecha_inicio} al {periodoInfo.fecha_fin}</div>}
        </div>
        <div className="col-12 col-md-5">
          <label className="form-label">Nombre</label>
          <input className="form-control" value={nombre} onChange={e=>setNombre(e.target.value)} maxLength={80}/>
        </div>
        <div className="col-12 col-md-3">
          <label className="form-label">Duración bloque (min)</label>
          <input type="number" min={1} className="form-control" value={duracion} onChange={e=>setDur(Number(e.target.value))}/>
        </div>
      </div>
      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-primary" type="submit">Guardar</button>
        {onCancel && <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
}

export default function CalendariosPage() {
  // data
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [cals, setCals]         = useState<Calendario[]>([]);
  // ui
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | undefined>();
  const [success, setSuccess]   = useState<string | undefined>();

  // toggles
  const [showPeriodoForm, setShowPeriodoForm]     = useState(false);
  const [editPeriodo, setEditPeriodo]             = useState<Periodo | null>(null);
  const [showCalendarioForm, setShowCalendarioForm] = useState(false);
  const [editCalendario, setEditCalendario]       = useState<Calendario | null>(null);

  async function loadAll() {
    try {
      setLoading(true);
      const [p, cal] = await Promise.all([
        http.get('/api/academics/periodos/'),
        http.get('/api/scheduling/calendarios/'),
      ]);
      console.log({ p, cal });
      // ordenar periodos por gestión/numero DESC como en backend
      const ps: Periodo[] = (p.data?.results ?? []).sort((a:Periodo,b:Periodo)=>
        (b.gestion - a.gestion) || (b.numero - a.numero));
      setPeriodos(ps);
      setCals(cal.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Error cargando datos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ loadAll(); }, []);

  async function createPeriodo(payload: Omit<Periodo,'id'>) {
    setError(undefined); setSuccess(undefined);
    try {
      await http.post('/api/academics/periodos/create/', payload);
      setShowPeriodoForm(false); setEditPeriodo(null);
      setSuccess('Período creado.');
      await loadAll();
    } catch (e:any) {
      setError(e?.response?.data?.detail || 'No se pudo crear el período.');
    }
  }
  async function updatePeriodo(id:number, payload: Omit<Periodo,'id'>) {
    setError(undefined); setSuccess(undefined);
    try {
      await http.put(`/api/academics/periodos/${id}/update/`, payload);
      setShowPeriodoForm(false); setEditPeriodo(null);
      setSuccess('Período actualizado.');
      await loadAll();
    } catch (e:any) {
      setError(e?.response?.data?.detail || 'No se pudo actualizar el período.');
    }
  }
  async function deletePeriodo(id:number) {
    if (!confirm('¿Eliminar período? Esta acción no se puede deshacer.')) return;
    setError(undefined); setSuccess(undefined);
    try {
      await http.delete(`/api/academics/periodos/${id}/delete/`);
      setSuccess('Período eliminado.');
      await loadAll();
    } catch (e:any) {
      setError(e?.response?.data?.detail || 'No se pudo eliminar el período.');
    }
  }

  async function createCalendario(payload: Omit<Calendario,'id'>) {
    setError(undefined); setSuccess(undefined);
    try {
      await http.post('/api/scheduling/calendarios/create/', payload);
      setShowCalendarioForm(false); setEditCalendario(null);
      setSuccess('Calendario creado.');
      await loadAll();
    } catch (e:any) {
      setError(e?.response?.data?.detail || 'No se pudo crear el calendario.');
    }
  }
  async function updateCalendario(id:number, payload: Omit<Calendario,'id'>) {
    setError(undefined); setSuccess(undefined);
    try {
      await http.put(`/api/scheduling/calendarios/${id}/update/`, payload);
      setShowCalendarioForm(false); setEditCalendario(null);
      setSuccess('Calendario actualizado.');
      await loadAll();
    } catch (e:any) {
      setError(e?.response?.data?.detail || 'No se pudo actualizar el calendario.');
    }
  }
  async function deleteCalendario(id:number) {
    if (!confirm('¿Eliminar calendario?')) return;
    setError(undefined); setSuccess(undefined);
    try {
      await http.delete(`/api/scheduling/calendarios/${id}/delete/`);
      setSuccess('Calendario eliminado.');
      await loadAll();
    } catch (e:any) {
      setError(e?.response?.data?.detail || 'No se pudo eliminar el calendario.');
    }
  }

  const periodoById = useMemo(() => {
    const m = new Map<number, Periodo>();
    periodos.forEach(p=>m.set(p.id, p));
    return m;
  }, [periodos]);

  return (
    <div className="container py-3">
      <h1 className="h4 mb-3">Calendarios</h1>

      {error && <div className="alert alert-danger py-2">{error}</div>}
      {success && <div className="alert alert-success py-2">{success}</div>}

      {loading ? (
        <div className="text-muted">Cargando…</div>
      ) : (
        <>
          {/* --------- Card: Periodos --------- */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h6 mb-0">Períodos académicos</h2>
                {!showPeriodoForm && !editPeriodo && (
                  <button className="btn btn-sm btn-primary" onClick={()=>{ setShowPeriodoForm(true); setEditPeriodo(null); }}>
                    Nuevo período
                  </button>
                )}
              </div>

              {(showPeriodoForm || editPeriodo) ? (
                <PeriodoForm
                  initial={editPeriodo ?? undefined}
                  existentes={periodos}
                  onCancel={()=>{ setShowPeriodoForm(false); setEditPeriodo(null); }}
                  onSubmit={async (payload)=> editPeriodo ? updatePeriodo(editPeriodo.id, payload) : createPeriodo(payload)}
                />
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Gestión</th>
                        <th>Número</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodos.map(p=>(
                        <tr key={p.id}>
                          <td>{p.gestion}</td>
                          <td>{p.numero}</td>
                          <td>{p.fecha_inicio}</td>
                          <td>{p.fecha_fin}</td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-secondary" onClick={()=>{ setEditPeriodo(p); setShowPeriodoForm(false); }}>
                                Editar
                              </button>
                              <button className="btn btn-outline-danger" onClick={()=>deletePeriodo(p.id)}>
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {periodos.length === 0 && (
                        <tr><td colSpan={5} className="text-muted small">Sin períodos registrados.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h6 mb-0">Calendarios</h2>
                {!showCalendarioForm && !editCalendario && (
                  <button className="btn btn-sm btn-primary" onClick={()=>{ setShowCalendarioForm(true); setEditCalendario(null); }}>
                    Nuevo calendario
                  </button>
                )}
              </div>

              {(showCalendarioForm || editCalendario) ? (
                <CalendarioForm
                  initial={editCalendario ?? undefined}
                  existentes={cals}
                  periodos={periodos}
                  onCancel={()=>{ setShowCalendarioForm(false); setEditCalendario(null); }}
                  onSubmit={async (payload)=> editCalendario ? updateCalendario(editCalendario.id, payload) : createCalendario(payload)}
                />
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Período</th>
                        <th>Nombre</th>
                        <th>Bloque (min)</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cals.map(c => {
                        const p = periodoById.get(c.periodo);
                        return (
                          <tr key={c.id}>
                            <td>{p ? `${p.gestion}/${p.numero}` : `#${c.periodo}`}</td>
                            <td>{c.nombre}</td>
                            <td>{c.duracion_bloque_min}</td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-secondary" onClick={()=>{ setEditCalendario(c); setShowCalendarioForm(false); }}>
                                  Editar
                                </button>
                                <button className="btn btn-outline-danger" onClick={()=>deleteCalendario(c.id)}>
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {cals.length === 0 && (
                        <tr><td colSpan={4} className="text-muted small">Sin calendarios.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
