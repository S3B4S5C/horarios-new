'use client';
import { useEffect, useState } from 'react';
import { listAsignaturas } from '@/services/academics';
import GruposForm from '@/components/academics/GruposForm';
import type { Asignatura } from '@/types/academics';

export default function GruposPage(){
  const [asigs, setAsigs] = useState<Asignatura[]>([]);
  const [error, setError] = useState<string|undefined>();
  useEffect(()=>{ (async()=>{
    try { setAsigs(await listAsignaturas()); }
    catch(e:any){ setError('No se pudieron cargar asignaturas.'); }
  })(); },[]);

  return (
      <div className="container py-3">
        {error && <div className="alert alert-danger">{error}</div>}
        {asigs.length>0 ? <GruposForm asignaturas={asigs} /> : <div className="alert alert-info">No hay asignaturas.</div>}
      </div>
  );
}
