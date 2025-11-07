'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { listPeriodos, listGrupos } from '@/services/academics';
import { listAsignaturas } from '@/services/academics';
import { listDocentes } from '@/services/users';
import { listAmbientes } from '@/services/facilities';
import { listCalendarios, listConflictos } from '@/services/scheduling';
import { listGruposPlanificacion } from '@/services/schedulingPlan';
import { listNotifications } from '@/services/notifications';

// Tipos mínimos locales defensivos (por si el backend cambia sutilmente)
type PeriodoLite = { id: number; gestion: number; numero: number };
type CalendarioLite = { id: number; periodo: number; nombre?: string };

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [periodos, setPeriodos] = useState<PeriodoLite[]>([]);
  const [selPeriodo, setSelPeriodo] = useState<number | null>(null);

  const [calendarioId, setCalendarioId] = useState<number | null>(null);
  const [calendarioNombre, setCalendarioNombre] = useState<string | null>(null);

  // KPIs
  const [asignaturasCount, setAsignaturasCount] = useState(0);
  const [gruposPeriodoCount, setGruposPeriodoCount] = useState(0);
  const [docentesCount, setDocentesCount] = useState(0);
  const [ambientesCount, setAmbientesCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conflictosCount, setConflictosCount] = useState(0);

  // Estado de planificación
  const [planRows, setPlanRows] = useState<any[]>([]);

  // Helpers
  function ordenarPeriodos(arr: PeriodoLite[]) {
    return [...arr].sort((a, b) => b.gestion - a.gestion || b.numero - a.numero);
  }

  async function pickUltimoCalendario(periodoId: number) {
    const cals = await listCalendarios();
    const delPeriodo = (cals as CalendarioLite[]).filter(c => c.periodo === periodoId);
    if (!delPeriodo.length) return { id: null as number | null, nombre: null as string | null };
    const last = delPeriodo.reduce((acc, it) => (it.id > acc.id ? it : acc), delPeriodo[0]);
    return { id: last.id, nombre: last.nombre ?? `Calendario #${last.id}` };
  }

  // Cargar períodos y fijar por defecto el más reciente
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const perRes = await listPeriodos();
        const arr = Array.isArray(perRes) ? perRes : (perRes?.results ?? []);
        const ordenados = ordenarPeriodos(arr as PeriodoLite[]);
        setPeriodos(ordenados);
        if (!selPeriodo && ordenados.length) {
          setSelPeriodo(ordenados[0].id);
        }
      } catch {
        setError('No se pudieron cargar los períodos.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cada vez que cambia el período: elegir último calendario y recargar KPIs/plan
  useEffect(() => {
    if (!selPeriodo) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Calendario del período
        const { id: calId, nombre: calNombre } = await pickUltimoCalendario(selPeriodo);
        setCalendarioId(calId);
        setCalendarioNombre(calNombre);

        // KPIs que no dependen del período
        const [asigs, docs, ambs, notifs] = await Promise.all([
          listAsignaturas(),
          listDocentes(),
          listAmbientes(),
          listNotifications({ unread: true }),
        ]);
        setAsignaturasCount(Array.isArray(asigs) ? asigs.length : 0);
        setDocentesCount(Array.isArray(docs) ? docs.length : 0);
        setAmbientesCount(Array.isArray(ambs) ? ambs.length : 0);
        setUnreadCount(Array.isArray(notifs) ? notifs.length : 0);

        // KPIs/estado del período seleccionado
        const [gruposPer, plan, conflictos] = await Promise.all([
          listGrupos({ periodo: selPeriodo }),
          listGruposPlanificacion({ periodo: selPeriodo, calendario: calId ?? undefined }),
          listConflictos().catch(() => []), // por si aún no está el endpoint
        ]);
        setGruposPeriodoCount(Array.isArray(gruposPer) ? gruposPer.length : 0);
        setPlanRows(Array.isArray(plan) ? plan : []);
        setConflictosCount(Array.isArray(conflictos) ? conflictos.length : 0);
      } catch {
        setError('No se pudo cargar el dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, [selPeriodo]);

  // Cálculo de estado de planificación (teoría/práctica)
  const planning = useMemo(() => {
    let T = { OK: 0, BAJO: 0, EXCESO: 0 };
    let P = { OK: 0, BAJO: 0, EXCESO: 0 };
    for (const r of planRows) {
      if (r?.estado?.teoria) T[r.estado.teoria as 'OK'|'BAJO'|'EXCESO'] = (T[r.estado.teoria as 'OK'|'BAJO'|'EXCESO'] ?? 0) + 1;
      if (r?.estado?.practica) P[r.estado.practica as 'OK'|'BAJO'|'EXCESO'] = (P[r.estado.practica as 'OK'|'BAJO'|'EXCESO'] ?? 0) + 1;
    }
    const total = planRows.length;
    return {
      T, P, total,
      tPct: total ? Math.round(((T.OK) / total) * 100) : 0,
      pPct: total ? Math.round(((P.OK) / total) * 100) : 0,
    };
  }, [planRows]);

  return (
    <div className="container-fluid py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 mb-0">Dashboard</h1>

        <div className="d-flex align-items-end gap-2">
          <div>
            <label className="form-label mb-1">Período</label>
            <select
              className="form-select"
              style={{ minWidth: 220 }}
              value={selPeriodo ?? ''}
              onChange={(e) => setSelPeriodo(Number(e.target.value))}
            >
              {periodos.map(p => (
                <option key={p.id} value={p.id}>
                  Gestión {p.gestion} – Período {p.numero}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label mb-1">Calendario (auto)</label>
            <div className="form-control bg-light">
              {calendarioId ? (calendarioNombre ?? `Calendario #${calendarioId}`) : '— Sin calendario —'}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !calendarioId && (
        <div className="alert alert-warning">
          No hay calendarios configurados para este período. Algunas métricas pueden estar incompletas.
        </div>
      )}

      {/* KPIs */}
      <div className="row g-3 mb-3">
        <div className="col-sm-6 col-xl-2">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Asignaturas</div>
              <div className="display-6 fw-semibold">{asignaturasCount}</div>
              <Link href="/asignaturas" className="small">Ver asignaturas</Link>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-2">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Grupos (período)</div>
              <div className="display-6 fw-semibold">{gruposPeriodoCount}</div>
              <Link href="/grupos" className="small">Gestionar grupos</Link>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-2">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Docentes activos</div>
              <div className="display-6 fw-semibold">{docentesCount}</div>
              <Link href="/docentes" className="small">Ver docentes</Link>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-2">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Ambientes</div>
              <div className="display-6 fw-semibold">{ambientesCount}</div>
              <Link href="/ambientes" className="small">Ver ambientes</Link>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-2">
          <div className="card h-100">
            <div className="card-body position-relative">
              <div className="text-muted small">Notificaciones</div>
              <div className="display-6 fw-semibold">{unreadCount}</div>
              <Link href="/notifications" className="small">Ir a notificaciones</Link>
              {unreadCount > 0 && (
                <span className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-danger">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-2">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Conflictos</div>
              <div className="display-6 fw-semibold">{conflictosCount}</div>
              <Link href="/conflictos" className="small">Revisar conflictos</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de planificación */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="mb-0">Estado de planificación del período</h6>
            <Link href="/planificacion" className="btn btn-sm btn-outline-primary">
              Abrir planificación
            </Link>
          </div>

          <div className="mb-2 small text-muted">Total de grupos considerados: {planning.total}</div>

          <div className="mb-3">
            <div className="d-flex justify-content-between">
              <div className="fw-semibold">Teoría</div>
              <div className="small text-muted">{planning.tPct}% OK</div>
            </div>
            <div className="progress" role="progressbar" aria-label="Teoría">
              <div className="progress-bar bg-success" style={{ width: `${(planning.T.OK / (planning.total || 1)) * 100}%` }}>
                OK ({planning.T.OK})
              </div>
              <div className="progress-bar bg-warning text-dark" style={{ width: `${(planning.T.BAJO / (planning.total || 1)) * 100}%` }}>
                BAJO ({planning.T.BAJO})
              </div>
              <div className="progress-bar bg-danger" style={{ width: `${(planning.T.EXCESO / (planning.total || 1)) * 100}%` }}>
                EXCESO ({planning.T.EXCESO})
              </div>
            </div>
          </div>

          <div>
            <div className="d-flex justify-content-between">
              <div className="fw-semibold">Práctica</div>
              <div className="small text-muted">{planning.pPct}% OK</div>
            </div>
            <div className="progress" role="progressbar" aria-label="Práctica">
              <div className="progress-bar bg-success" style={{ width: `${(planning.P.OK / (planning.total || 1)) * 100}%` }}>
                OK ({planning.P.OK})
              </div>
              <div className="progress-bar bg-warning text-dark" style={{ width: `${(planning.P.BAJO / (planning.total || 1)) * 100}%` }}>
                BAJO ({planning.P.BAJO})
              </div>
              <div className="progress-bar bg-danger" style={{ width: `${(planning.P.EXCESO / (planning.total || 1)) * 100}%` }}>
                EXCESO ({planning.P.EXCESO})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="card">
        <div className="card-body">
          <h6 className="mb-3">Acciones rápidas</h6>
          <div className="d-flex flex-wrap gap-2">
            <Link href="/planificacion" className="btn btn-primary">Planificar clases</Link>
            <Link href="/aulas/asignacion" className="btn btn-outline-primary">Asignar aulas</Link>
            <Link href="/exportar" className="btn btn-outline-secondary">Exportar horarios</Link>
            <Link href="/horarios" className="btn btn-outline-secondary">Ver horarios</Link>
            <Link href="/configuracion/bloques" className="btn btn-outline-secondary">Configurar bloques</Link>
            <Link href="/substituciones" className="btn btn-outline-secondary">Sustituciones</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
