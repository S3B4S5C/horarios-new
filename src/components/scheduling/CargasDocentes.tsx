"use client";
import React, { useEffect, useMemo, useState } from "react";
import { cargasDocentes, listCalendarios } from "@/services/scheduling";

export default function CargasDocentes() {
  const [calendario, setCalendario] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<number | null>(null);
  const [cals, setCals] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=> { listCalendarios().then(setCals); }, []);
  const selectedCal = useMemo(()=> cals.find(c=>c.id===calendario), [cals, calendario]);
  useEffect(()=> { if(selectedCal) setPeriodo(selectedCal.periodo); }, [selectedCal]);

  async function load() {
    if (!calendario || !periodo) return;
    setLoading(true);
    try { const data = await cargasDocentes({ calendario, periodo }); setItems(data.items); } finally { setLoading(false); }
  }
  useEffect(()=> { load(); }, [calendario, periodo]);

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h2 className="card-title h5 mb-1">Cálculo de horas (bloques de 45 min)</h2>
        <p className="text-muted mb-3">Resumen de carga por docente vs. mínima/máxima.</p>

        <div className="row g-3 align-items-end mb-3">
          <div className="col-12 col-md-4">
            <label className="form-label">Calendario</label>
            <select className="form-select" value={calendario ?? ""} onChange={(e)=>setCalendario(e.target.value?Number(e.target.value):null)}>
              <option value="">— seleccionar —</option>
              {cals.map((c)=> <option key={c.id} value={c.id}>{c.nombre ?? `Cal ${c.id}`}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label">Período</label>
            <input className="form-control" value={periodo ?? ""} onChange={(e)=>setPeriodo(Number(e.target.value))} placeholder="ID período" />
          </div>
          <div className="col-12 col-md-2">
            <button onClick={load} className="btn btn-outline-secondary">Actualizar</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Docente</th>
                <th>Bloques 45'</th>
                <th>Mín</th>
                <th>Máx</th>
                <th>Estado</th>
                <th>Clases</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it:any)=> (
                <tr key={it.docente}>
                  <td>{it.nombre}</td>
                  <td>{it.horas_45}</td>
                  <td>{it.carga_min_semanal}</td>
                  <td>{it.carga_max_semanal}</td>
                  <td>
                    <span className={
                      "badge " + (it.estado === "OK" ? "bg-success" : it.estado === "BAJO" ? "bg-warning text-dark" : "bg-danger")
                    }>{it.estado}</span>
                  </td>
                  <td>{it.clases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length===0 && !loading && <p className="text-muted small mb-0">Selecciona calendario/período.</p>}
      </div>
    </div>
  );
}
