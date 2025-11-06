'use client';
import React, { useEffect, useMemo, useState } from 'react';

import { listCalendarios, gridSemana } from '@/services/scheduling';
import { listEdificios, listAmbientes } from '@/services/facilities';
import { asignarAulas, type AsignarAulasItem } from '@/services/aulas';
import { Ambiente } from '@/types';

type Calendario = { id:number; nombre?:string; periodo:number };
type Edificio = { id:number; codigo:string; nombre:string };

export default function AutoAsignacionAulasPanel() {
  const [calendarios, setCalendarios] = useState<Calendario[]>([]);
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);

  const [calendario, setCalendario] = useState<number | null>(null);
  const selectedCal = useMemo(()=> calendarios.find(c=>c.id===calendario) || null, [calendarios, calendario]);
  const periodo = selectedCal?.periodo ?? null;

  const [preferEdificio, setPreferEdificio] = useState<number | ''>('');
  const [force, setForce] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AsignarAulasItem[] | null>(null);

  const ambienteLabel = useMemo(()=> {
    const edifMap = new Map(edificios.map(e=> [e.id, `${e.codigo} · ${e.nombre}`]));
    const map: Record<number,string> = {};
    ambientes.forEach(a => { map[a.id] = `${a.codigo} · ${a.nombre} — ${edifMap.get(a.edificio)}`; });
    return map;
  }, [ambientes, edificios]);

  const [claseLabel, setClaseLabel] = useState<Record<number,string>>({});

  // catálogos
  useEffect(()=> {
    (async () => {
      try {
        const [cals, eds, ambs] = await Promise.all([
          listCalendarios(),
          listEdificios(),
          listAmbientes(),
        ]);
        setCalendarios(cals);
        setEdificios(eds);
        setAmbientes(ambs);
        if (!calendario && cals.length) setCalendario(cals[0].id);
      } catch {
        setError('No se pudieron cargar catálogos.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // labels de clases desde grilla semanal
  async function refreshClaseLabels() {
    if (!periodo || !calendario) return;
    try {
      const grid = await gridSemana({ periodo, calendario });
      const map: Record<number,string> = {};
      for (const c of grid.celdas) {
        map[c.clase_id] = `${c.asignatura} · ${c.grupo_codigo} · ${c.docente}${c.ambiente?` · ${c.ambiente}`:''}`;
      }
      setClaseLabel(map);
    } catch { /* noop */ }
  }
  useEffect(()=> { refreshClaseLabels(); }, [periodo, calendario]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!periodo || !calendario) return;
    setLoading(true); setError(null);
    try {
      const resp = await asignarAulas({
        periodo,
        calendario,
        prefer_edificio: preferEdificio === '' ? undefined : Number(preferEdificio),
        force,
      });
      setItems(resp.asignaciones);
      await refreshClaseLabels();
    } catch (err:any) {
      setError(err?.response?.data?.detail || err?.message || 'Error al asignar aulas.');
      setItems(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h2 className="card-title h5 mb-1">HU014 · Asignación automática de aulas</h2>
        <p className="text-muted mb-3">Asigna aulas/labs libres compatibles con capacidad y tipo.</p>

        <form onSubmit={onSubmit} className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label">Calendario</label>
            <select
              className="form-select"
              value={calendario ?? ''}
              onChange={(e)=> setCalendario(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— seleccionar —</option>
              {calendarios.map(c=> (
                <option key={c.id} value={c.id}>
                  {c.nombre ? `${c.nombre} (Per. ${c.periodo})` : `Cal ${c.id} · Per. ${c.periodo}`}
                </option>
              ))}
            </select>
            <div className="form-text">Período: {periodo ?? '—'}</div>
          </div>

          <div className="col-12 col-md-5">
            <label className="form-label">Preferir edificio (opcional)</label>
            <select
              className="form-select"
              value={preferEdificio}
              onChange={(e)=> setPreferEdificio(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">— Cualquiera —</option>
              {edificios.map(e=> <option key={e.id} value={e.id}>{e.codigo} · {e.nombre}</option>)}
            </select>
          </div>

          <div className="col-12 col-md-3">
            <div className="form-check mb-2">
              <input id="force" className="form-check-input" type="checkbox" checked={force} onChange={e=> setForce(e.target.checked)} />
              <label htmlFor="force" className="form-check-label">Forzar</label>
            </div>
            <button className="btn btn-primary w-100" disabled={!periodo || !calendario || loading}>
              {loading ? 'Asignando…' : 'Asignar aulas'}
            </button>
          </div>
        </form>

        {error && <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div>}

        {items && (
          <>
            <hr className="my-4" />
            <AsignacionesResultadoTabla
              items={items}
              maps={{ claseLabel, ambienteLabel }}
            />
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-outline-secondary" onClick={()=>refreshClaseLabels()}>
                Refrescar etiquetas
              </button>
              {items.some(i=> i.estado!=='asignado') && (
                <button
                  className="btn btn-outline-primary"
                  onClick={(e)=> { setForce(true); onSubmit(e as any); }}
                >
                  Reintentar con “force”
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import AsignacionesResultadoTabla from './AsignacionesResultadoTabla';
