'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Bloque, Calendario } from '@/types/scheduling';
import { createBloque, deleteBloque, listBloques, updateBloque } from '@/services/scheduling';

function timeToMinutes(t: string) { const [h,m] = t.split(':').map(Number); return h*60 + m; }
function minutesToTime(min: number) { const h = Math.floor(min/60).toString().padStart(2,'0'); const m = (min%60).toString().padStart(2,'0'); return `${h}:${m}:00`; }

export default function BloquesConfig({ calendario, duracionBase }: { calendario: Calendario; duracionBase: number; }) {
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|undefined>();

  async function refresh() {
    setLoading(true);
    try { setBloques(await listBloques(calendario.id)); }
    catch(e:any){ setError('Error al cargar bloques'); }
    finally{ setLoading(false); }
  }
  useEffect(()=>{ refresh(); },[calendario.id]);

  async function addBloque() {
    const orden = (bloques.at(-1)?.orden ?? 0) + 1;
    const inicio = bloques.length ? timeToMinutes(bloques.at(-1)!.hora_fin) : 8*60; // desde 08:00
    const fin = minutesToTime(inicio + duracionBase);
    const payload: Omit<Bloque,'id'> = { calendario: calendario.id, orden, hora_inicio: minutesToTime(inicio), hora_fin: fin, duracion_min: duracionBase };
    try { await createBloque(payload); await refresh(); }
    catch(e:any){ setError('No se pudo crear el bloque'); }
  }

  async function updateDuracion(id: number, orden: number, inicio: string, duracion_min: number) {
    const fin = minutesToTime(timeToMinutes(inicio) + duracion_min);
    try { await updateBloque(id, { orden, hora_inicio: inicio, hora_fin: fin, duracion_min }); await refresh(); }
    catch(e:any){ setError('No se pudo actualizar'); }
  }

  async function removeBloque(id: number) {
    if (!confirm('¿Eliminar bloque?')) return;
    try { await deleteBloque(id); await refresh(); }
    catch(e:any){ setError('No se pudo eliminar'); }
  }

  const warningDuracion = useMemo(() => bloques.some(b=> b.duracion_min !== duracionBase), [bloques, duracionBase]);

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {warningDuracion && <div className="alert alert-warning">Hay bloques cuya duración difiere del calendario ({duracionBase}’). Al guardar, verifique impacto en clases y disponibilidades.</div>}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="m-0">Bloques del calendario</h6>
        <button className="btn btn-sm btn-success" onClick={addBloque}>Añadir bloque</button>
      </div>
      {loading ? <div>Cargando...</div> : (
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead><tr><th>#</th><th>Inicio</th><th>Fin</th><th>Duración (min)</th><th className="text-end">Acciones</th></tr></thead>
            <tbody>
              {bloques.map(b => (
                <tr key={b.id}>
                  <td style={{width:80}}>
                    <input type="number" className="form-control form-control-sm" value={b.orden} onChange={e=>updateDuracion(b.id, Number(e.target.value), b.hora_inicio, b.duracion_min)} />
                  </td>
                  <td style={{width:150}}>
                    <input type="time" className="form-control form-control-sm" value={b.hora_inicio.slice(0,5)} onChange={e=>updateDuracion(b.id, b.orden, `${e.target.value}:00`, b.duracion_min)} />
                  </td>
                  <td style={{width:150}}>
                    <input type="time" disabled className="form-control form-control-sm" value={b.hora_fin.slice(0,5)} />
                  </td>
                  <td style={{width:160}}>
                    <input type="number" min={15} step={5} className="form-control form-control-sm" value={b.duracion_min} onChange={e=>updateDuracion(b.id, b.orden, b.hora_inicio, Number(e.target.value))} />
                  </td>
                  <td className="text-end" style={{width:120}}>
                    <button className="btn btn-sm btn-outline-danger" onClick={()=>removeBloque(b.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}