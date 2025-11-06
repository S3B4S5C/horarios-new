"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  detectarConflictos,
  listCalendarios,
  listConflictos,
  moverClase,
  resolverConflicto,
  gridSemana,
} from "@/services/scheduling";
import { listGrupos } from "@/services/academics";
import { listDocentes } from "@/services/users";
import type { Conflicto } from "@/types";

type ClaseInfo = {
  clase_id: number;
  asignatura: string;
  asignatura_id: number;
  grupo: string;
  grupo_id: number;
  docente?: string | null;
  docente_id?: number | null;
  ambiente?: string | null;
  ambiente_id?: number | null;
  day_of_week?: number;
  bloque_inicio_orden?: number;
  bloques_duracion?: number;
};

export default function ConflictosPanel() {
  const [calendario, setCalendario] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<number | null>(null);
  const [cals, setCals] = useState<any[]>([]);

  const [items, setItems] = useState<Conflicto[]>([]);
  const [loading, setLoading] = useState(false);

  // enriquecimiento
  const [claseInfoMap, setClaseInfoMap] = useState<Record<number, ClaseInfo>>({});
  const [bloqueByOrden, setBloqueByOrden] = useState<Record<number, { hora_inicio: string; hora_fin: string }>>({});
  const [docentes, setDocentes] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const docenteById = useMemo(() => Object.fromEntries(docentes.map((d) => [d.id, d])), [docentes]);
  const grupoById = useMemo(() => Object.fromEntries(grupos.map((g) => [g.id, g])), [grupos]);

  useEffect(() => {
    listCalendarios().then(setCals);
    listDocentes().then(setDocentes);
    // Cargar todos los grupos una vez para mostrar código/turno si hace falta
    listGrupos({}).then(setGrupos);
  }, []);

  const selectedCal = useMemo(
    () => cals.find((c) => c.id === calendario),
    [cals, calendario]
  );
  useEffect(() => {
    if (selectedCal) setPeriodo(selectedCal.periodo);
  }, [selectedCal]);

  function dayName(d?: number) {
    return d === 1
      ? "Lun"
      : d === 2
      ? "Mar"
      : d === 3
      ? "Mié"
      : d === 4
      ? "Jue"
      : d === 5
      ? "Vie"
      : d === 6
      ? "Sáb"
      : d === 7
      ? "Dom"
      : "—";
  }
  function bloqueLabel(orden?: number) {
    if (!orden) return "B—";
    const t = bloqueByOrden[orden];
    return t ? `B${orden} ${t.hora_inicio}–${t.hora_fin}` : `B${orden}`;
    }

  async function hydrateClaseInfo() {
    if (!calendario || !periodo) return;
    const grid = await gridSemana({ calendario, periodo });
    const info: Record<number, ClaseInfo> = {};
    const bmap: Record<number, { hora_inicio: string; hora_fin: string }> = {};
    grid.bloques.forEach((b: any) => (bmap[b.orden] = { hora_inicio: b.hora_inicio, hora_fin: b.hora_fin }));
    for (const c of grid.celdas) {
      info[c.clase_id] = {
        clase_id: c.clase_id,
        asignatura: c.asignatura,
        asignatura_id: c.asignatura_id,
        grupo: c.grupo_codigo,
        grupo_id: c.grupo_id,
        docente: c.docente,
        docente_id: c.docente_id,
        ambiente: c.ambiente,
        ambiente_id: c.ambiente_id,
        day_of_week: c.day_of_week,
        bloque_inicio_orden: c.bloque_inicio_orden,
        bloques_duracion: c.bloques_duracion,
      };
    }
    setClaseInfoMap(info);
    setBloqueByOrden(bmap);
  }

  async function refresh() {
    const data = await listConflictos();
    setItems(data);
    // enriquecer etiquetas si hay contexto de calendario/período
    if (calendario && periodo) await hydrateClaseInfo();
  }

  async function onDetectar() {
    if (!periodo) return;
    setLoading(true);
    try {
      await detectarConflictos({
        periodo,
        calendario: calendario || undefined,
        persistir: true,
      });
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    // al cambiar calendario/período, rehidratar mapeos para mostrar nombres en lugar de IDs
    if (calendario && periodo) hydrateClaseInfo();
  }, [calendario, periodo]);

  function renderClase(id: number) {
    const ci = claseInfoMap[id];
    if (!ci) return <>#{id}</>;
    const g = grupoById[ci.grupo_id];
    const d = ci.docente_id ? docenteById[ci.docente_id] : undefined;
    return (
      <div>
        <div className="fw-medium">
          {ci.asignatura} · {g?.codigo ?? ci.grupo}
        </div>
        <div className="text-muted small">
          {d?.nombre_completo ?? ci.docente ?? "—"}
          {ci.ambiente ? ` · ${ci.ambiente}` : ""}
        </div>
        <div className="text-muted small">
          {dayName(ci.day_of_week)} · {bloqueLabel(ci.bloque_inicio_orden)} × {ci.bloques_duracion}
        </div>
      </div>
    );
  }

  function tipoBadge(tipo: string) {
    const map: Record<string, string> = {
      DOCENTE: "bg-primary",
      AMBIENTE: "bg-secondary",
      GRUPO: "bg-info",
    };
    return <span className={`badge ${map[tipo] ?? "bg-secondary"}`}>{tipo}</span>;
  }

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h2 className="card-title h5 mb-1">Validación de conflictos</h2>
        <p className="text-muted mb-3">
          Detecta solapes Docente/Ambiente/Grupo y permite resolver moviendo clases.
        </p>

        <div className="row g-3 align-items-end mb-3">
          <div className="col-12 col-md-3">
            <label className="form-label">Calendario</label>
            <select
              className="form-select"
              value={calendario ?? ""}
              onChange={(e) => setCalendario(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— seleccionar —</option>
              {cals.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre ?? `Cal ${c.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-2">
            <label className="form-label">Período</label>
            <input
              className="form-control"
              value={periodo ?? ""}
              onChange={(e) => setPeriodo(Number(e.target.value))}
              placeholder="ID período"
            />
          </div>
          <div className="col-12 col-md-7 d-flex gap-2">
            <button className="btn btn-warning" onClick={onDetectar} disabled={!periodo || loading}>
              {loading ? "Detectando…" : "Detectar conflictos"}
            </button>
            <button className="btn btn-outline-secondary" onClick={refresh}>
              Refrescar
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Tipo</th>
                <th>Clase A</th>
                <th>Clase B</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{tipoBadge(c.tipo)}</td>
                  <td>{renderClase(c.clase_a)}</td>
                  <td>{renderClase(c.clase_b)}</td>
                  <td>
                    <ResolverBtns
                      conflictoId={c.id}
                      claseA={c.clase_a}
                      claseB={c.clase_b}
                      claseInfoMap={claseInfoMap}
                      bloqueByOrden={bloqueByOrden}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && <p className="text-muted small mb-0">No hay conflictos.</p>}
        {!calendario || !periodo ? (
          <p className="text-muted small mt-2 mb-0">
            Selecciona calendario y período para ver detalles completos (asignatura, grupo, docente, aula).
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ResolverBtns({
  conflictoId,
  claseA,
  claseB,
  claseInfoMap,
  bloqueByOrden,
}: {
  conflictoId: number;
  claseA: number;
  claseB: number;
  claseInfoMap: Record<number, ClaseInfo>;
  bloqueByOrden: Record<number, { hora_inicio: string; hora_fin: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [clase, setClase] = useState<number>(claseA);
  const [day, setDay] = useState<number>(1);
  const [bloque, setBloque] = useState<number>(1);
  const [dur, setDur] = useState<number>(1);
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Prefill con la info real de la clase seleccionada
    const ci = claseInfoMap[clase];
    if (ci) {
      setDay(ci.day_of_week ?? 1);
      setBloque(ci.bloque_inicio_orden ?? 1);
      setDur(ci.bloques_duracion ?? 1);
    }
  }, [open, clase, claseInfoMap]);

  function dayName(d?: number) {
    return d === 1
      ? "Lun"
      : d === 2
      ? "Mar"
      : d === 3
      ? "Mié"
      : d === 4
      ? "Jue"
      : d === 5
      ? "Vie"
      : d === 6
      ? "Sáb"
      : "Dom";
  }

  function claseLabel(id: number) {
    const ci = claseInfoMap[id];
    if (!ci) return `#${id}`;
    return `${ci.asignatura} · ${ci.grupo} · ${ci.docente ?? "—"}${ci.ambiente ? ` · ${ci.ambiente}` : ""}`;
  }

  async function executeMove() {
    setBusy(true);
    setResult(null);
    try {
      const r = await moverClase({
        clase,
        new_day_of_week: day as any,
        new_bloque_inicio: bloque,
        new_bloques_duracion: dur,
        dry_run: dryRun,
        motivo: `Resolver conflicto ${conflictoId}`,
      });
      setResult(
        r.updated ? (dryRun ? "Sin conflictos en simulación" : "Movimiento aplicado") : "No se pudo aplicar"
      );
      if (!dryRun) {
        await resolverConflicto(conflictoId);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="d-flex gap-2">
      <button className="btn btn-outline-secondary btn-sm" onClick={() => setOpen((v) => !v)}>
        {open ? "Ocultar" : "Mover clase"}
      </button>
      <button className="btn btn-success btn-sm" onClick={() => resolverConflicto(conflictoId)}>
        Marcar resuelto
      </button>
      {open && (
        <div className="mt-3 border rounded bg-light p-3">
          <div className="row g-2 align-items-end">
            <div className="col-12">
              <div className="small text-muted mb-1">
                Editando: <span className="fw-semibold">{claseLabel(clase)}</span>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small">Clase</label>
              <select className="form-select form-select-sm" value={clase} onChange={(e) => setClase(Number(e.target.value))}>
                <option value={claseA}>A — {claseLabel(claseA)}</option>
                <option value={claseB}>B — {claseLabel(claseB)}</option>
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label small">Día</label>
              <select className="form-select form-select-sm" value={day} onChange={(e) => setDay(Number(e.target.value))}>
                <option value={1}>Lun</option>
                <option value={2}>Mar</option>
                <option value={3}>Mié</option>
                <option value={4}>Jue</option>
                <option value={5}>Vie</option>
                <option value={6}>Sáb</option>
                <option value={7}>Dom</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small">Bloque inicio</label>
              <select
                className="form-select form-select-sm"
                value={bloque}
                onChange={(e) => setBloque(Number(e.target.value))}
              >
                {Object.entries(bloqueByOrden).map(([orden, t]) => (
                  <option key={orden} value={Number(orden)}>
                    B{orden} {t.hora_inicio}–{t.hora_fin}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small">Duración (bloques)</label>
              <input
                className="form-control form-control-sm"
                type="number"
                min={1}
                value={dur}
                onChange={(e) => setDur(Number(e.target.value))}
              />
            </div>
            <div className="col-12 col-md-12">
              <div className="form-check">
                <input
                  id={`dry-${conflictoId}`}
                  className="form-check-input"
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                />
                <label htmlFor={`dry-${conflictoId}`} className="form-check-label small">
                  Simular primero (dry-run)
                </label>
              </div>
            </div>
            <div className="col-12 d-flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={executeMove} disabled={busy}>
                {busy ? "Ejecutando…" : dryRun ? "Simular" : "Aplicar"}
              </button>
            </div>
            {result && <div className="col-12 small">{result}</div>}
            <div className="col-12 small text-muted">
              Nueva ubicación: <strong>{dayName(day)}</strong> ·{" "}
              <strong>
                {bloqueByOrden[bloque]
                  ? `B${bloque} ${bloqueByOrden[bloque].hora_inicio}–${bloqueByOrden[bloque].hora_fin}`
                  : `B${bloque}`}
              </strong>{" "}
              × <strong>{dur}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
