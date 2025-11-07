'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { listPeriodos } from '@/services/academics';
import { listGruposPlanificacion } from '@/services/schedulingPlan';
import { listDocentes } from '@/services/users';
import { listGrupos } from '@/services/academics';

type Props = {
  onEdit: (groupId: number, periodoId: number) => void;
  periodoId: number | null;
  onPeriodoChange: (id: number | null) => void;
};

export default function GruposPlanList({ onEdit, periodoId, onPeriodoChange }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [gruposAll, setGruposAll] = useState<any[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔐 para ignorar respuestas viejas
  const reqRef = useRef(0);

  useEffect(() => {
    (async () => {
      const [per, gs, docs] = await Promise.all([listPeriodos(), listGrupos(), listDocentes()]);
      const arr = Array.isArray(per) ? per : (per?.results ?? []);
      const ordenados = [...arr].sort((a, b) => b.gestion - a.gestion || b.numero - a.numero);
      setPeriodos(ordenados);
      setGruposAll(gs);
      setDocentes(docs);
    })();
  }, []);

  useEffect(() => {
    const myReq = ++reqRef.current;           // id de esta request
    const ctrl = new AbortController();       // abort controller para axios/fetch

    setLoading(true);
    (async () => {
      try {
        const r = await listGruposPlanificacion(
          periodoId ? { periodo: periodoId } : {},
          { signal: ctrl.signal }
        );
        if (reqRef.current === myReq) {       // sólo si sigue siendo la última
          setRows(r);
          console.log({ r });
        }
      } catch (_e) {
        // si fue abortado, ignoramos
      } finally {
        
        if (reqRef.current === myReq) setLoading(false);
      }
    })();

    // al cambiar periodoId o desmontar, aborta la request anterior
    return () => ctrl.abort();
  }, [periodoId]);

  const docenteById = useMemo(() => {
    const m = new Map<number, string>();
    docentes.forEach((d: any) => m.set(d.id, d.nombre_completo));
    return m;
  }, [docentes]);

  const grupoDocente = (grupoId: number) => {
    const g = gruposAll.find((x: any) => x.id === grupoId);
    return g?.docente ? docenteById.get(g.docente) ?? `Docente #${g.docente}` : '—';
  };

  const badge = (estado: 'OK'|'BAJO'|'EXCESO') =>
    `badge rounded-pill ${estado==='OK' ? 'bg-success' : estado==='BAJO' ? 'bg-warning text-dark' : 'bg-danger'}`;

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
          <div>
            <label className="form-label mb-1">Período de trabajo</label>
            <select
              className="form-select"
              value={periodoId ?? ''}
              onChange={(e) => onPeriodoChange(e.target.value ? Number(e.target.value) : null)}
            >
              {periodos.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.gestion} - {p.numero}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Asignatura</th>
                <th>Docente</th>
                <th className="text-center">Teoría (req vs prog)</th>
                <th className="text-center">Práctica (req vs prog)</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.map((r: any) => {
                const reqT = r.requeridos.teoria_horas_semana ?? 0;
                const reqP = r.requeridos.practica_horas_semana ?? 0;
                const pT = r.programado.teoria.horas ?? 0;
                const pP = r.programado.practica.horas ?? 0;
                const estT = r.estado.teoria;
                const estP = r.estado.practica;

                const rowClass =
                  estT==='EXCESO' || estP==='EXCESO' ? 'table-danger' :
                  estT==='BAJO'   || estP==='BAJO'   ? 'table-warning' : 'table-success';

                return (
                  <tr key={r.grupo} className={(pT===0 && pP===0 && reqT===0 && reqP===0) ? '' : rowClass}>
                    <td><div className="fw-semibold">{r.codigo ?? `#${r.grupo}`}</div><div className="text-muted small">ID {r.grupo}</div></td>
                    <td>{r.asignatura.codigo} · {r.asignatura.nombre}</td>
                    <td>{grupoDocente(r.grupo)}</td>
                    <td className="text-center">
                      <div className="fw-semibold">{pT.toFixed(2)}h</div>
                      <small className="text-muted">Req: {reqT.toFixed(2)}h</small>
                    </td>
                    <td className="text-center">
                      <div className="fw-semibold">{pP.toFixed(2)}h</div>
                      <small className="text-muted">Req: {reqP.toFixed(2)}h</small>
                    </td>
                    <td>
                      <span className={badge(estT)} title="Teoría">{estT}</span>{' '}
                      <span className={badge(estP)} title="Práctica">{estP}</span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={!periodoId}
                        onClick={() => periodoId && onEdit(r.grupo, periodoId)}
                      >Editar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading && <div className="text-muted">Cargando…</div>}
        {!loading && rows.length===0 && <div className="text-muted">No hay grupos.</div>}
      </div>
    </div>
  );
}
