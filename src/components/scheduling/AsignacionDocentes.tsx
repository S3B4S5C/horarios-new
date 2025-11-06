"use client";
import React, { useEffect, useMemo, useState } from "react";
import { listCalendarios, proponerDocentes } from "@/services/scheduling";
import { PropuestaDocenteResponse } from "@/types";
import { listAsignaturas, listGrupos } from "@/services/academics";
import { listDocentes } from "@/services/users";

export default function AsignacionDocente() {
  const [calendario, setCalendario] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<number | null>(null);
  const [asignatura, setAsignatura] = useState<number | undefined>();
  const [turno, setTurno] = useState<number | undefined>();
  const [persistir, setPersistir] = useState(false);
  const [preferEsp, setPreferEsp] = useState(true);
  const [loading, setLoading] = useState(false);

  const [cals, setCals] = useState<any[]>([]);
  const [asigs, setAsigs] = useState<any[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);

  const [res, setRes] = useState<PropuestaDocenteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // helpers
  const asignaturaById = useMemo(() => {
    const m = new Map<number, any>();
    asigs.forEach((a) => m.set(a.id, a));
    return m;
  }, [asigs]);

  const docenteById = useMemo(() => {
    const m = new Map<number, any>();
    docentes.forEach((d) => m.set(d.id, d));
    return m;
  }, [docentes]);

  const grupoById = useMemo(() => {
    const m = new Map<number, any>();
    grupos.forEach((g) => m.set(g.id, g));
    return m;
  }, [grupos]);

  const turnoNombre = (t?: number) =>
    t === 1 ? "Mañana" : t === 2 ? "Tarde" : t === 3 ? "Noche" : "—";

  useEffect(() => {
    listCalendarios().then(setCals);
    listAsignaturas().then(setAsigs);
    listDocentes().then(setDocentes);
  }, []);

  const selectedCal = useMemo(
    () => cals.find((c) => c.id === calendario),
    [cals, calendario]
  );
  useEffect(() => {
    if (selectedCal) setPeriodo(selectedCal.periodo);
  }, [selectedCal]);

  useEffect(() => {
    const params: any = {};
    if (asignatura) params.asignatura_id = asignatura;
    if (turno) params.turno_id = turno;
    listGrupos(params).then(setGrupos);
  }, [asignatura, turno]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!calendario || !periodo) return;
    setLoading(true);
    setError(null);
    try {
      const data = await proponerDocentes({
        calendario,
        periodo,
        asignatura,
        turno,
        persistir,
        prefer_especialidad: preferEsp,
      });
      setRes(data);
      const ids = new Set(data.sugerencias.map((s) => s.grupo));
      const missing = Array.from(ids).some((id) => !grupoById.get(id));
      if (missing) {
        listGrupos({}).then(setGrupos);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Error al proponer docentes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h2 className="card-title h5 mb-1">
          Algoritmo de asignación de docentes
        </h2>
        <p className="text-muted mb-3">
          Genera sugerencias de docente por grupo y permite persistir en BD.
        </p>

        <form onSubmit={onSubmit} className="row g-3 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label">Calendario</label>
            <select
              className="form-select"
              value={calendario ?? ""}
              onChange={(e) =>
                setCalendario(e.target.value ? Number(e.target.value) : null)
              }
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

          <div className="col-12 col-md-4">
            <label className="form-label">Asignatura (opcional)</label>
            <select
              className="form-select"
              value={asignatura ?? ""}
              onChange={(e) =>
                setAsignatura(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
            >
              <option value="">Todas</option>
              {asigs.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.codigo} · {a.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Turno (opcional)</label>
            <select
              className="form-select"
              value={turno ?? ""}
              onChange={(e) =>
                setTurno(e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">Todos</option>
              <option value={1}>Mañana</option>
              <option value={2}>Tarde</option>
              <option value={3}>Noche</option>
            </select>
          </div>

          <div className="col-12 d-flex flex-wrap align-items-center gap-3">
            <div className="form-check form-check-inline">
              <input
                id="preferEsp"
                className="form-check-input"
                type="checkbox"
                checked={preferEsp}
                onChange={(e) => setPreferEsp(e.target.checked)}
              />
              <label htmlFor="preferEsp" className="form-check-label">
                Preferir especialidad
              </label>
            </div>
            <div className="form-check form-check-inline">
              <input
                id="persistir"
                className="form-check-input"
                type="checkbox"
                checked={persistir}
                onChange={(e) => setPersistir(e.target.checked)}
              />
              <label htmlFor="persistir" className="form-check-label">
                Persistir en BD
              </label>
            </div>
            <button
              disabled={!calendario || !periodo || loading}
              className="btn btn-primary"
            >
              {loading ? "Procesando…" : "Proponer"}
            </button>
          </div>
        </form>

        {error && (
          <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div>
        )}

        {res && (
          <div className="mt-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h3 className="h6 mb-0">Sugerencias</h3>
              {!persistir && (
                <button
                  onClick={() => {
                    setPersistir(true);
                    setTimeout(
                      () =>
                        document
                          .querySelector("form")
                          ?.dispatchEvent(
                            new Event("submit", {
                              cancelable: true,
                              bubbles: true,
                            })
                          ),
                      0
                    );
                  }}
                  className="btn btn-outline-secondary btn-sm"
                >
                  Aplicar y guardar
                </button>
              )}
            </div>

            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Grupo</th>
                    <th>Asignatura</th>
                    <th>Turno</th>
                    <th>Docente sugerido</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {res.sugerencias.map((s, i) => {
                    const g = grupoById.get(s.grupo);
                    const a = g ? asignaturaById.get(g.asignatura) : undefined;
                    const d =
                      s.docente_sugerido != null
                        ? docenteById.get(s.docente_sugerido)
                        : undefined;
                    return (
                      <tr key={i}>
                        <td>
                          {g?.codigo ? g.codigo : `#${s.grupo}`}
                          {g && (
                            <div className="text-muted small">
                              ID {g.id} · Período {g.periodo}
                            </div>
                          )}
                        </td>
                        <td>
                          {a ? (
                            <>
                              {a.codigo} · {a.nombre}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{turnoNombre(g?.turno)}</td>
                        <td>
                          {d ? (
                            <>
                              {d.nombre_completo}
                              <div className="text-muted small">ID {d.id}</div>
                            </>
                          ) : s.docente_sugerido ? (
                            <>#{s.docente_sugerido}</>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{s.motivo}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {res.sugerencias.length === 0 && (
              <p className="text-muted small mb-0">
                Sin sugerencias para los filtros.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
