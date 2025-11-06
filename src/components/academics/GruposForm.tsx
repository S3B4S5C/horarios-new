"use client";
import { useEffect, useMemo, useState } from "react";
// import axios from "axios"; // (opcional) no se usa
import type { Grupo, Periodo, Turno } from "@/types/academics";
import type { Asignatura } from "@/types/academics";
import {
  bulkCreateGrupos,
  createGrupo,
  listGrupos,
  listPeriodos,
} from "@/services/academics";
import { listDocentes } from "@/services/users";
import { listCalendarios } from "@/services/scheduling";

// Tipos locales mínimos para listas
type DocenteLite = { id: number; nombre_completo: string };
type CalendarioLite = { id: number; periodo: number; nombre?: string };

// Payload de creación SIN 'codigo' (el backend lo autogenera)
type GrupoCreatePayload = Omit<Grupo, "id" | "codigo"> & { codigo?: string };

const TURNOS_OPTS: Turno[] = [
  { id: 1, nombre: "Mañana" },
  { id: 2, nombre: "Tarde" },
  { id: 3, nombre: "Noche" },
];

// A/B/C según regla (1->A, 2->B, 3->C)
function letraDeTurno(t: Turno): "A" | "B" | "C" {
  return t.id === 1 ? "A" : t.id === 2 ? "B" : "C";
}

function generarEtiquetas(baseLetra: string, cantidad: number) {
  return Array.from({ length: cantidad }, (_, i) => `${baseLetra}${i + 1}`);
}

export default function GruposForm({
  asignaturas,
}: {
  asignaturas: Asignatura[];
}) {
  const [selAsig, setSelAsig] = useState<number | undefined>(
    asignaturas[0]?.id
  );
  const [turno, setTurno] = useState<Turno>(TURNOS_OPTS[0]);
  const [capacidad, setCapacidad] = useState<number>(30);
  const [inscritos, setInscritos] = useState<number>(0);

  // Nuevos: periodo + docente
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [selPeriodo, setSelPeriodo] = useState<number | null>(null);


  const [docentes, setDocentes] = useState<DocenteLite[]>([]);
  const [selDocente, setSelDocente] = useState<number | null>(null);

  const [existentes, setExistentes] = useState<Grupo[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [ok, setOk] = useState<string | undefined>();

  // Cargar grupos al cambiar asignatura
  useEffect(() => {
    (async () => {
      if (!selAsig) return;
      try {
        setExistentes(await listGrupos({ asignatura: selAsig }));
        setError(undefined);
      } catch (e: any) {
        if (e?.message === "ENDPOINT_GRUPOS_FALTANTE")
          setError(
            "Faltan endpoints /api/academics/grupos/* en backend (ver guía abajo)."
          );
        else setError("No se pudieron cargar grupos.");
      }
    })();
  }, [selAsig]);

  // Cargar calendarios -> derivar periodos únicos
  useEffect(() => {
    (async () => {
      try {
        const data = await listPeriodos();
        // ordenar por gestión desc y luego periodo desc (ajusta si quieres asc)
        const ordenados = (data.results || []).sort(
          (a, b) => b.gestion - a.gestion || b.numero - a.numero
        );
        setPeriodos(ordenados);
        if (ordenados.length && selPeriodo == null) {
          setSelPeriodo(ordenados[0].id ?? null);
        }
      } catch {
        setError(prev => prev ?? 'No se pudieron cargar calendarios/periodos.');
      }
    })();
  }, []);

  // Cargar docentes
  useEffect(() => {
    (async () => {
      try {
        const data = await listDocentes();
        setDocentes(data || []);
      } catch {
        setError((prev) => prev ?? "No se pudieron cargar docentes.");
      }
    })();
  }, []);

  // Sugerir etiquetas (solo visual)
  const sugeridosCodigos = useMemo(() => {
    const letra = letraDeTurno(turno);
    const cant = Math.max(1, Math.ceil(inscritos / 25)); // HU010 1/25
    return generarEtiquetas(letra, cant);
  }, [turno, inscritos]);

  // Helpers
  function readyToCreate(): boolean {
    return Boolean(selAsig && selPeriodo && turno?.id && capacidad >= 1);
  }

  function buildGrupoPayload(): GrupoCreatePayload {
    return {
      asignatura: selAsig!, // id
      periodo: selPeriodo!, // id de periodo
      turno: turno.id!, // id
      docente: selDocente, // puede ser number o null
      capacidad,
    };
  }

  async function handleCrearUno() {
    if (!readyToCreate()) {
      setError("Selecciona Asignatura, Periodo y Turno para crear.");
      return;
    }
    try {
      const payload = buildGrupoPayload();
      console.log('payload', { payload });
      const nuevo = await createGrupo(payload);
      console.log({ nuevo });
      setOk(`Grupo ${nuevo?.codigo ? nuevo.codigo : ""} creado.`);
      setError(undefined);
      if (selAsig) setExistentes(await listGrupos({ asignatura: selAsig }));
    } catch (e: any) {
      if (e?.response?.data) {
        const d = e.response.data;
        const detail =
          d?.periodo?.[0] ||
          d?.turno?.[0] ||
          d?.docente?.[0] ||
          d?.detail ||
          "No se pudo crear.";
        setError(String(detail));
      } else if (e?.message === "ENDPOINT_GRUPOS_FALTANTE") {
        setError("Faltan endpoints en backend.");
      } else {
        setError("No se pudo crear.");
      }
    }
  }

  async function handleCrearTodos() {
    if (!readyToCreate()) {
      setError("Selecciona Asignatura, Periodo y Turno para crear.");
      return;
    }
    try {
      const count = sugeridosCodigos.length; // número sugerido
      const payloads = Array.from({ length: count }, () => buildGrupoPayload());
      console.log('DEBUG payload crear grupo', payloads);
      await bulkCreateGrupos(payloads);
      setOk("Grupos creados.");
      setError(undefined);
      if (selAsig) setExistentes(await listGrupos({ asignatura: selAsig }));
    } catch (e: any) {
      if (e?.response?.data) {
        const d = e.response.data;
        const detail =
          d?.periodo?.[0] ||
          d?.turno?.[0] ||
          d?.docente?.[0] ||
          d?.detail ||
          "No se pudo crear en lote.";
        setError(String(detail));
      } else if (e?.message === "ENDPOINT_GRUPOS_FALTANTE") {
        setError("Faltan endpoints en backend.");
      } else {
        setError("No se pudo crear en lote.");
      }
    }
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="row g-3">
          {/* Asignatura */}
          <div className="col-md-4">
            <label className="form-label">Asignatura</label>
            <select
              className="form-select"
              value={selAsig}
              onChange={(e) => setSelAsig(Number(e.target.value))}
            >
              {asignaturas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.codigo} — {a.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Periodo (id) */}
          <div className="col-md-2">
            <label className="form-label">Periodo</label>
            <select
              className="form-select"
              value={selPeriodo ?? ''}
              onChange={(e) => setSelPeriodo(Number(e.target.value))}
            >
              {periodos.map((p) => (
                <option key={p.id} value={p.id}>
                  Periodo {p.gestion} - {p.numero}
                </option>
              ))}
            </select>

          </div>

          {/* Turno */}
          <div className="col-md-2">
            <label className="form-label">Turno</label>
            <select
              className="form-select"
              value={turno.id}
              onChange={(e) => {
                const t = TURNOS_OPTS.find(
                  (x) => x.id === Number(e.target.value)
                );
                if (t) setTurno(t);
              }}
            >
              {TURNOS_OPTS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} ({letraDeTurno(t)}*)
                </option>
              ))}
            </select>
          </div>

          {/* Docente (id) */}
          <div className="col-md-4">
            <label className="form-label">Docente</label>
            <select
              className="form-select"
              value={selDocente ?? ""} // '' cuando es null
              onChange={(e) => {
                const v = e.target.value;
                setSelDocente(v === "" ? null : Number(v));
              }}
            >
              <option value="">Ninguno</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre_completo}
                </option>
              ))}
            </select>
          </div>

          {/* Capacidad */}
          <div className="col-md-2">
            <label className="form-label">Capacidad por grupo</label>
            <input
              type="number"
              className="form-control"
              min={10}
              value={capacidad}
              onChange={(e) => setCapacidad(Number(e.target.value))}
            />
          </div>

          {/* Inscritos */}
          <div className="col-md-2">
            <label className="form-label">Inscritos (estimado)</label>
            <input
              type="number"
              className="form-control"
              min={0}
              value={inscritos}
              onChange={(e) => setInscritos(Number(e.target.value))}
            />
          </div>
        </div>

        {error && <div className="alert alert-warning mt-3">{error}</div>}
        {ok && <div className="alert alert-success mt-3">{ok}</div>}

        {/* Sugerencias */}
        <div className="mt-3">
          <h6 className="mb-2">
            Sugerencia de etiquetas{" "}
            <small className="text-muted">
              (referencial; el código se autogenerará)
            </small>
          </h6>
          <div className="row g-2">
            {sugeridosCodigos.map((codigo, i) => (
              <div className="col-md-3" key={i}>
                <div className="border rounded p-2 d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-semibold">{codigo}</div>
                    <small>
                      Cap: {capacidad} • Turno: {turno.nombre}
                      {selPeriodo ? ` • Periodo: ${selPeriodo}` : ""}
                      {` • Docente: ${selDocente
                          ? docentes.find((d) => d.id === selDocente)
                            ?.nombre_completo ?? selDocente
                          : "Ninguno"
                        }`}
                    </small>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleCrearUno} // << ya no pasa 'codigo'
                    disabled={!readyToCreate()}
                    title={
                      !readyToCreate()
                        ? "Selecciona Asignatura, Periodo y Turno"
                        : "Crear (código auto)"
                    }
                  >
                    Crear
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex gap-2 mt-3">
            <button
              className="btn btn-primary"
              onClick={handleCrearTodos}
              disabled={!readyToCreate()}
            >
              Crear todos ({sugeridosCodigos.length})
            </button>
          </div>
        </div>

        <hr className="my-4" />
        {/* Grupos existentes */}
        <div className="mt-4">
          <h6 className="mb-2">Grupos existentes</h6>

          {existentes.length === 0 ? (
            <div className="text-muted">
              No hay grupos creados para la asignatura seleccionada.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle">
                <thead>
                  <tr>
                    <th style={{ width: "8rem" }}>Código</th>
                    <th>Turno</th>
                    <th>Docente</th>
                    <th style={{ width: "8rem" }}>Capacidad</th>
                    <th style={{ width: "8rem" }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {existentes.map((g) => (
                    <tr
                      key={
                        g.id ??
                        `${g.asignatura}-${g.periodo}-${g.codigo ?? "s/cod"}`
                      }
                    >
                      <td className="fw-semibold">{g.codigo ?? "—"}</td>
                      <td>
                        {TURNOS_OPTS.find((t) => t.id === g.turno)?.nombre ??
                          `Turno ${g.turno}`}
                      </td>
                      <td>
                        {g.docente ? (
                          docentes.find((d) => d.id === g.docente)
                            ?.nombre_completo ?? `ID ${g.docente}`
                        ) : (
                          <span className="text-muted">Ninguno</span>
                        )}
                      </td>
                      <td>{g.capacidad ?? "—"}</td>
                      <td>
                        <span
                          className={`badge ${g.estado === "confirmado"
                              ? "bg-success"
                              : g.estado === "cerrado"
                                ? "bg-dark"
                                : "bg-secondary"
                            }`}
                        >
                          {g.estado ?? "borrador"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
