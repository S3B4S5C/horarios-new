'use client';
import { useEffect, useState } from 'react';
import { listCalendarios, listBloques } from '@/services/scheduling';
import { listAsignaturas } from '@/services/academics';
import { http } from '@/lib/http';
import type { Calendario, Bloque } from '@/types/scheduling';
import type { Docente } from '@/types/users';
import DisponibilidadGrid from '@/components/scheduling/DisponibilidadGrid';

export default function DisponibilidadPage(){
  const [cals, setCals] = useState<Calendario[]>([]);
  const [selCal, setSelCal] = useState<number|undefined>();
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [selDoc, setSelDoc] = useState<number|undefined>();
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [error, setError] = useState<string|undefined>();

  useEffect(()=>{ (async()=>{
    try {
      const [c] = await Promise.all([listCalendarios()]);
      setCals(c); setSelCal(c[0]?.id);
      const { data } = await http.get('/api/users/docentes/');
      setDocentes(data); setSelDoc(data[0]?.id);
    } catch(e:any){ setError('No se pudo cargar datos iniciales.'); }
  })(); },[]);

  useEffect(()=>{ (async()=>{
    if (!selCal) return; try { setBloques(await listBloques(selCal)); } catch(e:any){ setError('No se pudieron cargar bloques.'); }
  })(); },[selCal]);

  return (
      <div className="container py-3">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label">Calendario</label>
            <select className="form-select" value={selCal} onChange={e=>setSelCal(Number(e.target.value))}>
              {cals.map(c=> <option key={c.id} value={c.id}>{c.nombre || `Calendario ${c.id}`} — Periodo {c.periodo}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Docente</label>
            <select className="form-select" value={selDoc} onChange={e=>setSelDoc(Number(e.target.value))}>
              {docentes.map(d=> <option key={d.id} value={d.id}>{d.nombre_completo}</option>)}
            </select>
          </div>
        </div>
        {selCal && selDoc && bloques.length>0 ? (
          <DisponibilidadGrid calendarioId={selCal} docenteId={selDoc} bloques={bloques} />
        ) : (
          <div className="alert alert-info">Asegurese de que el Calendario tenga bloques.</div>
        )}
      </div>
  );
}
