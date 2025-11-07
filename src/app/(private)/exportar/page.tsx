'use client';

import React, { useEffect, useMemo, useState } from "react";
import { exportHorarioPDF, gridSemana, GridResponse } from "@/services/export";
import { listCalendarios } from "@/services/scheduling";
import { listDocentes } from "@/services/users";
import { listGrupos } from "@/services/academics";
import { listAmbientes } from "@/services/facilities";
import { useAuth } from "@/context/AuthContext";
import { Grupo } from "@/types";

type O = { id: number; [k: string]: any };

function dowLabel(d: number) {
  return ({1:"Lunes",2:"Martes",3:"Miércoles",4:"Jueves",5:"Viernes",6:"Sábado",7:"Domingo"} as any)[d] || d;
}

export default function ExportacionHorarioPDF() {
  const { role, user } = useAuth();
  const isDocente = role === "DOCENTE";

  const [calendario, setCalendario] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<number | null>(null);

  const [docente, setDocente] = useState<number | undefined>();
  const [grupo, setGrupo] = useState<number | undefined>();
  const [ambiente, setAmbiente] = useState<number | undefined>();

  const [cals, setCals] = useState<O[]>([]);
  const [docentes, setDocentes] = useState<O[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [ambientes, setAmbientes] = useState<O[]>([]);

  const [preview, setPreview] = useState<GridResponse | null>(null);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meDocenteMissing, setMeDocenteMissing] = useState(false);

  const selectedCal = useMemo(
    () => cals.find((c) => c.id === calendario),
    [cals, calendario]
  );

  useEffect(() => {
    if (selectedCal) setPeriodo(selectedCal.periodo);
  }, [selectedCal]);

  // Cargar catálogos
  useEffect(() => {
    (async () => {
      try {
        const [calsResp, docsResp, ambResp, gruposResp] = await Promise.all([
          listCalendarios(),
          listDocentes(),
          listAmbientes(),
          listGrupos({}), // luego filtramos por período
        ]);

        setCals(calsResp);
        setAmbientes(ambResp);
        setGrupos(gruposResp);

        if (isDocente) {
          // fijar a "mi" docente
          const mine = (docsResp || []).find((d: any) => d.user === user?.id);
          if (!mine) {
            setMeDocenteMissing(true);
            setDocentes([]);
            setDocente(undefined);
          } else {
            setDocentes([mine]);       // solo yo en la lista
            setDocente(mine.id);       // valor fijo para filtros/export
          }
        } else {
          setDocentes(docsResp || []);
        }
      } catch (e: any) {
        setError("No se pudieron cargar los catálogos.");
      }
    })();
  }, [isDocente, user?.id]);

  const gruposPeriodo = useMemo(() => {
    if (!periodo) return grupos;
    return grupos.filter((g: any) => g.periodo === periodo);
  }, [grupos, periodo]);

  async function onPreview(e: React.FormEvent) {
    e.preventDefault();
    if (!calendario || !periodo) return;
    setError(null);
    setLoadingPrev(true);
    setPreview(null);
    try {
      const data = await gridSemana({
        calendario,
        periodo,
        docente,   // 👈 si es DOCENTE, ya está fijado a su id
        grupo,
        ambiente,
      });
      setPreview(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "No se pudo generar la vista previa.");
    } finally {
      setLoadingPrev(false);
    }
  }

  async function onExport(e: React.FormEvent) {
    e.preventDefault();
    if (!calendario || !periodo) return;
    setError(null);
    setLoadingPDF(true);
    try {
      const blob = await exportHorarioPDF({
        calendario,
        periodo,
        docente,
        grupo,
        ambiente,
      });
      const file = new Blob([blob], { type: "application/pdf" });
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      let name = `Horario-${periodo}-cal${calendario}`;
      if (docente) name += `-doc${docente}`;
      if (grupo) name += `-grp${grupo}`;
      if (ambiente) name += `-aum${ambiente}`;
      a.href = url;
      a.download = `${name}-${stamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "No se pudo exportar el PDF.");
    } finally {
      setLoadingPDF(false);
    }
  }

  // Helpers para tabla de vista previa
  const tablaFilas = useMemo(() => {
    if (!preview) return [];
    const byDay = new Map<number, any[]>();
    preview.celdas.forEach((c) => {
      const arr = byDay.get(c.day_of_week) || [];
      arr.push(c);
      byDay.set(c.day_of_week, arr);
    });
    const bloquesByOrden = new Map(preview.bloques.map(b => [b.orden, b]));
    const rows: any[] = [];
    for (const [day, arr] of Array.from(byDay.entries()).sort((a,b)=>a[0]-b[0])) {
      arr.sort((a,b) => a.bloque_inicio_orden - b.bloque_inicio_orden);
      arr.forEach(c => {
        const bIni = bloquesByOrden.get(c.bloque_inicio_orden);
        const bFin = bloquesByOrden.get(c.bloque_inicio_orden + c.bloques_duracion - 1) || bIni;
        rows.push({
          day,
          rango: bIni && bFin ? `${bIni.hora_inicio.slice(0,5)}–${bFin.hora_fin.slice(0,5)}` : "—",
          bloque: `${c.bloque_inicio_orden} (${c.bloques_duracion})`,
          asignatura: c.asignatura,
          docente: c.docente,
          ambiente: c.ambiente || "—",
          grupo: c.grupo_codigo,
          tipo: c.tipo === "T" ? "Teoría" : "Práctica",
        });
      });
    }
    return rows;
  }, [preview]);

  const docenteNombre = useMemo(() => {
    if (!docente) return "";
    const d = docentes.find((x) => x.id === docente);
    return (d as any)?.nombre_completo ?? `Docente #${docente}`;
  }, [docente, docentes]);

  const buttonsDisabled =
    !calendario || !periodo || loadingPrev || loadingPDF || (isDocente && meDocenteMissing);

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h2 className="card-title h5 mb-1">Exportación de horario (PDF)</h2>
        <p className="text-muted mb-3">
          Genera un PDF en formato tabular <em>(día, bloque, asignatura, docente y aula)</em>.
          Aplica filtros antes de exportar.
        </p>

        {/* Filtros */}
        <form className="row g-3 align-items-end" onSubmit={onPreview}>
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

          {/* Campo Docente con modo bloqueado para role DOCENTE */}
          <div className="col-12 col-md-3">
            <label className="form-label">Docente {isDocente ? "(fijo)" : "(opcional)"}</label>
            {isDocente ? (
              <>
                <input className="form-control" value={docenteNombre || "No vinculado"} readOnly disabled />
                {meDocenteMissing && (
                  <div className="form-text text-danger">
                    Tu usuario no está vinculado a un registro de Docente. Contacta con administración.
                  </div>
                )}
              </>
            ) : (
              <select
                className="form-select"
                value={docente ?? ""}
                onChange={(e) => setDocente(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Todos</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {(d as any).nombre_completo}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="col-12 col-md-2">
            <label className="form-label">Grupo (opcional)</label>
            <select
              className="form-select"
              value={grupo ?? ""}
              onChange={(e) => setGrupo(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Todos</option>
              {gruposPeriodo.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.codigo ? `${g.codigo}` : `#${g.id}`} · Asig {g.asignatura}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-2">
            <label className="form-label">Aula (opcional)</label>
            <select
              className="form-select"
              value={ambiente ?? ""}
              onChange={(e) => setAmbiente(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Todas</option>
              {ambientes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.codigo} · {a.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 d-flex flex-wrap align-items-center gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={onPreview}
              disabled={buttonsDisabled}
              type="button"
            >
              {loadingPrev ? "Generando…" : "Vista previa"}
            </button>

            <button
              className="btn btn-primary"
              onClick={onExport}
              disabled={buttonsDisabled}
              type="button"
            >
              {loadingPDF ? "Exportando…" : "Exportar PDF"}
            </button>
          </div>
        </form>

        {error && <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div>}

        {/* Vista previa */}
        {preview && (
          <div className="mt-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h3 className="h6 mb-0">Vista previa tabular</h3>
              <span className="badge bg-light text-dark">
                {preview.celdas.length} clases
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Rango</th>
                    <th>Bloque</th>
                    <th>Asignatura</th>
                    <th>Docente</th>
                    <th>Aula</th>
                    <th>Grupo</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filas: any[] = [];
                    const byDay = new Map<number, any[]>();
                    preview.celdas.forEach((c) => {
                      const arr = byDay.get(c.day_of_week) || [];
                      arr.push(c);
                      byDay.set(c.day_of_week, arr);
                    });
                    const bloquesByOrden = new Map(preview.bloques.map((b) => [b.orden, b]));
                    for (const [day, arr] of Array.from(byDay.entries()).sort((a, b) => a[0] - b[0])) {
                      arr.sort((a, b) => a.bloque_inicio_orden - b.bloque_inicio_orden);
                      arr.forEach((c) => {
                        const bIni = bloquesByOrden.get(c.bloque_inicio_orden);
                        const bFin = bloquesByOrden.get(c.bloque_inicio_orden + c.bloques_duracion - 1) || bIni;
                        filas.push({
                          day,
                          rango: bIni && bFin ? `${bIni.hora_inicio.slice(0, 5)}–${bFin.hora_fin.slice(0, 5)}` : "—",
                          bloque: `${c.bloque_inicio_orden} (${c.bloques_duracion})`,
                          asignatura: c.asignatura,
                          docente: c.docente,
                          ambiente: c.ambiente || "—",
                          grupo: c.grupo_codigo,
                          tipo: c.tipo === "T" ? "Teoría" : "Práctica",
                        });
                      });
                    }
                    return filas.length
                      ? filas.map((r, i) => (
                          <tr key={i}>
                            <td>{dowLabel(r.day)}</td>
                            <td>{r.rango}</td>
                            <td>{r.bloque}</td>
                            <td>{r.asignatura}</td>
                            <td>{r.docente}</td>
                            <td>{r.ambiente}</td>
                            <td>{r.grupo}</td>
                            <td>{r.tipo}</td>
                          </tr>
                        ))
                      : (
                        <tr>
                          <td colSpan={8} className="text-muted small">
                            Sin resultados para los filtros.
                          </td>
                        </tr>
                      );
                  })()}
                </tbody>
              </table>
            </div>
            <p className="text-muted small mb-0">
              La vista previa es informativa. El layout final lo define el PDF del backend.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
