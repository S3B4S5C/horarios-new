'use client';
import { useEffect, useMemo, useState } from 'react';
import { listBloques } from '@/services/scheduling';

import { listAmbientes } from '@/services/facilities';
import { listDocentes } from '@/services/users';
import { listGrupos } from '@/services/academics';

import { bulkCreateClases, bulkDeleteClases, listClasesDeGrupo } from '@/services/schedulingPlan';

type Bloque = { id:number; orden:number; hora_inicio:string; hora_fin:string; duracion_min:number };
type ClaseLite = {
  id?: number;
  grupo: number;
  tipo: 'T'|'P';
  day_of_week: 1|2|3|4|5|6|7;
  bloque_inicio: number;
  bloques_duracion: number;
  ambiente: number;
  docente: number | null;
  estado: 'propuesto'|'confirmado'|'cancelado';
  _local?: 'new' | 'delete';
};

const DAYS = [
  { id:1, label:'Lun' },{ id:2, label:'Mar' },{ id:3, label:'Mié' },
  { id:4, label:'Jue' },{ id:5, label:'Vie' },{ id:6, label:'Sáb' },{ id:7, label:'Dom' },
];

type Props = {
  groupId: number;
  calendarioId: number;
  onCancel: () => void;
  onSaved: () => void;
};

export default function GrupoEditor({ groupId, calendarioId, onCancel, onSaved }: Props) {
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [clasesExist, setClasesExist] = useState<ClaseLite[]>([]);
  const [toCreate, setToCreate] = useState<ClaseLite[]>([]);
  const [toDelete, setToDelete] = useState<number[]>([]);
  const [ambientes, setAmbientes] = useState<any[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [tipo, setTipo] = useState<'T'|'P'>('T');
  const [ambienteId, setAmbienteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(()=> {
    (async () => {
      const [bls, ambs, docs, gs, clases] = await Promise.all([
        listBloques(calendarioId),
        listAmbientes(),
        listDocentes(),
        listGrupos(),
        listClasesDeGrupo(groupId, true),
      ]);
      setBloques(bls);
      setAmbientes(ambs);
      setDocentes(docs);
      setGrupos(gs);
      setClasesExist(clases as any);
      setAmbienteId(ambs?.[0]?.id ?? null);
    })();
  },[groupId, calendarioId]);

  const grupo = useMemo(()=> grupos.find((g:any)=> g.id===groupId), [grupos, groupId]);
  const docenteId: number | null = grupo?.docente ?? null;
  const docenteNombre = useMemo(()=> {
    if (!docenteId) return null;
    const d = docentes.find((x:any)=> x.id===docenteId);
    return d?.nombre_completo ?? `Docente #${docenteId}`;
  },[docenteId, docentes]);

  const ocupadas = useMemo(()=> {
    const map = new Map<string, ClaseLite>();
    clasesExist
      .filter(c=> !toDelete.includes(c.id!))
      .forEach(c=>{
        for (let k=0; k<(c.bloques_duracion || 1); k++) map.set(`${c.day_of_week}-${c.bloque_inicio + k}`, c);
      });
    toCreate.forEach(c=>{
      for (let k=0; k<(c.bloques_duracion || 1); k++) map.set(`${c.day_of_week}-${c.bloque_inicio + k}`, c);
    });
    return map;
  },[clasesExist, toCreate, toDelete]);

  function toggleCell(day:number, bloqueId:number) {
    const key = `${day}-${bloqueId}`;
    const current = ocupadas.get(key);

    if (current) {
      // si es nueva -> quitar
      if (!current.id && current.bloque_inicio === bloqueId && current.day_of_week === day) {
        setToCreate(prev => prev.filter(c => !(c.day_of_week===day && c.bloque_inicio===bloqueId)));
        return;
      }
      // si existe -> marcar para borrar (solo si se clickea en su bloque de inicio)
      if (current.id && current.bloque_inicio === bloqueId && current.day_of_week === day) {
        setToDelete(prev => prev.includes(current.id!) ? prev : [...prev, current.id!]);
      }
      return;
    }

    // Permitir crear aun sin docente (irá como null). Ambiente sigue siendo requerido.
    if (!ambienteId) return;

    const nueva: ClaseLite = {
      grupo: groupId,
      tipo,
      day_of_week: day as any,
      bloque_inicio: bloqueId,
      bloques_duracion: 1,
      ambiente: ambienteId,
      docente: docenteId ?? null, // <-- null si el grupo no tiene docente
      estado: 'propuesto',
      _local: 'new',
    };
    setToCreate(prev => [...prev, nueva]);
  }

  async function saveAll(finish:boolean) {
    setSaving(true);
    try {
      if (toDelete.length) await bulkDeleteClases(toDelete);
      if (toCreate.length) await bulkCreateClases(toCreate.map(({_local, ...d})=> d));
      if (finish) onSaved();
      else {
        const fresh = await listClasesDeGrupo(groupId, true);
        setClasesExist(fresh as any);
        setToCreate([]); setToDelete([]);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="card-body">

        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
          <div>
            <h3 className="h5 mb-1">Editar grupo #{groupId}</h3>
            <div className="text-muted small">
              {docenteId
                ? <>Docente: <span className="fw-semibold">{docenteNombre}</span></>
                : <span className="text-warning">Este grupo no tiene docente asignado. Las clases nuevas se crearán <span className="fw-semibold">sin docente</span>.</span>}
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={onCancel} disabled={saving}>Cancelar</button>
            <button className="btn btn-outline-primary" onClick={()=>saveAll(false)} disabled={saving || (!toCreate.length && !toDelete.length)}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button className="btn btn-primary" onClick={()=>saveAll(true)} disabled={saving || (!toCreate.length && !toDelete.length)}>
              {saving ? 'Guardando…' : 'Guardar y terminar'}
            </button>
          </div>
        </div>

        <div className="row g-3 align-items-end mb-3">
          <div className="col-12 col-sm-3">
            <label className="form-label">Tipo de clase</label>
            <select className="form-select" value={tipo} onChange={e=>setTipo(e.target.value as any)}>
              <option value="T">Teoría</option>
              <option value="P">Práctica</option>
            </select>
          </div>
          <div className="col-12 col-sm-4">
            <label className="form-label">Ambiente por defecto</label>
            <select className="form-select" value={ambienteId ?? ''} onChange={e=>setAmbienteId(e.target.value?Number(e.target.value):null)}>
              {ambientes.map((a:any)=> <option key={a.id} value={a.id}>{a.codigo} · {a.nombre} (cap. {a.capacidad})</option>)}
            </select>
          </div>
          <div className="col-12 col-sm-5 text-sm-end">
            <div className="small text-muted">
              Clic para <span className="fw-semibold">crear</span> un bloque; clic sobre el inicio de una clase existente para <span className="fw-semibold">eliminar</span>.
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered align-middle text-center">
            <thead className="table-light">
              <tr>
                <th style={{minWidth:110}}>Bloque</th>
                {DAYS.map(d=> <th key={d.id}>{d.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {bloques.map(b=> (
                <tr key={b.id}>
                  <td className="text-start">
                    <div className="fw-semibold">#{b.id} <span className="text-muted">({b.orden})</span></div>
                    <small className="text-muted">{b.hora_inicio.slice(0,5)}–{b.hora_fin.slice(0,5)}</small>
                  </td>
                  {DAYS.map(d=> {
                    const key = `${d.id}-${b.id}`;
                    const cell = ocupadas.get(key);
                    const isStart = cell && cell.bloque_inicio === b.id && cell.day_of_week === d.id;
                    const isNew = !!cell && !cell.id;
                    const markedDelete = !!cell?.id && isStart && toDelete.includes(cell.id!);

                    return (
                      <td key={key}>
                        <button
                          className={
                            'btn btn-sm w-100 ' +
                            (cell
                              ? (markedDelete ? 'btn-outline-danger'
                                : isNew ? 'btn-success'
                                : 'btn-primary')
                              : 'btn-outline-secondary')
                          }
                          onClick={()=>toggleCell(d.id, b.id)}
                          title={
                            cell
                              ? (isNew ? 'Nueva (pendiente de guardar)' : (markedDelete ? 'Marcada para eliminar' : 'Clase existente'))
                              : 'Vacío'
                          }
                        >
                          {cell
                            ? (isNew ? `${cell.tipo}` : (isStart ? `${cell.tipo}${markedDelete?' ×':''}` : '·'))
                            : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row g-3 mt-3">
          <div className="col-12 col-lg-6">
            <div className="card">
              <div className="card-body">
                <h6 className="card-title mb-2">Nuevas (pendientes)</h6>
                <ul className="list-group list-group-flush">
                  {toCreate.map((c, i)=> (
                    <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                      <span>{c.tipo} · día {c.day_of_week} · bloque #{c.bloque_inicio}{c.docente === null ? ' · sin docente' : ''}</span>
                      <button className="btn btn-sm btn-outline-danger" onClick={()=>setToCreate(prev => prev.filter((_,idx)=>idx!==i))}>Quitar</button>
                    </li>
                  ))}
                  {toCreate.length===0 && <li className="list-group-item text-muted">Sin nuevas clases.</li>}
                </ul>
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div className="card">
              <div className="card-body">
                <h6 className="card-title mb-2">Marcadas para eliminar</h6>
                <ul className="list-group list-group-flush">
                  {toDelete.map((id)=> (
                    <li key={id} className="list-group-item d-flex justify-content-between align-items-center">
                      <span>Clase #{id}</span>
                      <button className="btn btn-sm btn-outline-secondary" onClick={()=>setToDelete(prev => prev.filter(x=>x!==id))}>Deshacer</button>
                    </li>
                  ))}
                  {toDelete.length===0 && <li className="list-group-item text-muted">Nada para eliminar.</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
