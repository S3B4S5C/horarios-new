'use client';
import { useEffect, useState } from 'react';
import { listCalendarios } from '@/services/scheduling';
import type { Calendario } from '@/types/scheduling';
import BloquesConfig from '@/components/scheduling/BloquesConfig';

export default function BloquesPage(){
  const [cals, setCals] = useState<Calendario[]>([]);
  const [sel, setSel] = useState<number|undefined>();
  const [error, setError] = useState<string|undefined>();

  useEffect(()=>{ (async()=>{
    try { const data = await listCalendarios(); setCals(data); setSel(data[0]?.id); }
    catch(e:any){ setError('No se pudieron cargar calendarios.'); }
  })(); },[]);

  const cal = cals.find(c=>c.id===sel);

  return (
      <div className="container py-3">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="mb-3">
          <label className="form-label">Calendario</label>
          <select className="form-select" value={sel} onChange={e=>setSel(Number(e.target.value))}>
            {cals.map(c=> <option key={c.id} value={c.id}>{c.nombre || `Calendario ${c.id}`} — Periodo {c.periodo}</option>)}
          </select>
        </div>
        {cal ? (
          <BloquesConfig calendario={cal} duracionBase={cal.duracion_bloque_min ?? 45} />
        ) : (
          <div className="alert alert-info">Seleccione un calendario.</div>
        )}
      </div>
  );
}