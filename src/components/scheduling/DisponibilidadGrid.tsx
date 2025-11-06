'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Bloque, DisponibilidadDocente } from '@/types/scheduling';
import { createDisponibilidad, deleteDisponibilidad, listDisponibilidad } from '@/services/scheduling';

interface Props {
  calendarioId: number;
  docenteId: number;
  bloques: Bloque[];
}

const DAYS: { id: number; label: string; }[] = [
  { id: 1, label: 'Lun' }, { id: 2, label: 'Mar' }, { id: 3, label: 'Mié' }, { id: 4, label: 'Jue' }, { id: 5, label: 'Vie' }, { id: 6, label: 'Sáb' }
];

export default function DisponibilidadGrid({ calendarioId, docenteId, bloques }: Props) {
  const [rows, setRows] = useState<DisponibilidadDocente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  async function refresh() {
    setLoading(true);
    try { setRows(await listDisponibilidad({ calendario: calendarioId, docente: docenteId })); }
    catch (e: any) { setError('No se pudo cargar la disponibilidad.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, [calendarioId, docenteId]);

  const occupied = useMemo(() => {
    const map = new Map<string, DisponibilidadDocente>();
    rows.forEach(r => {
      for (let k = 0; k < (r.bloques_duracion || 1); k++) {
        map.set(`${r.day_of_week}-${r.bloque_inicio + k}`, r);
      }
    });
    return map;
  }, [rows]);

  async function toggleCell(day: number, orden: number, id: number) {
    const key = `${day}-${id}`;
    const existing = occupied.get(key);
    if (existing) {
      // borrar solo si es la primera celda del rango
      if (existing.bloque_inicio === id) {
        try { await deleteDisponibilidad(existing.id); await refresh(); } catch (e: any) { setError('No se pudo eliminar'); }
      }
      return;
    }
    // crear duración 1 por defecto, sin solapes
    const payload = { calendario: calendarioId, docente: docenteId, day_of_week: day as any, bloque_inicio: id, bloques_duracion: 1, preferencia: 1 } as Omit<DisponibilidadDocente, 'id'>;
    try { await createDisponibilidad(payload); await refresh(); } catch (e: any) { setError('No se pudo crear'); }
  }

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="table-responsive">
        <table className="table table-bordered align-middle text-center">
          <thead className="table-light">
            <tr>
              <th style={{ minWidth: 90 }}>Bloque</th>
              {DAYS.map(d => <th key={d.id}>{d.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {bloques.map(b => (
              <tr key={b.id}>
                <td className="text-start">
                  <div className="fw-semibold">{b.id}</div>
                  <small>{b.hora_inicio.slice(0, 5)}–{b.hora_fin.slice(0, 5)}</small>
                </td>
                {DAYS.map(d => {
                  const cell = occupied.get(`${d.id}-${b.id}`);
                  return (
                    <td key={d.id}>
                      <button
                        className={`btn btn-sm w-100 ${cell ? 'btn-success' : 'btn-outline-secondary'}`}
                        onClick={() => toggleCell(d.id, b.orden, b.id)}
                        title={cell ? 'Disponible' : 'No disponible'}
                      >{cell ? '✓' : ''}</button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="small text-muted">Clic para alternar. Sin solapes: cada clic crea/elimina 1 bloque de disponibilidad.
      </div>
    </div>
  );
}