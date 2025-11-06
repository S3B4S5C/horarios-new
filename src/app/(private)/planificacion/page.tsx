"use client";

import { useEffect, useState } from "react";
import GruposPlanList from "@/components/scheduling/GruposPlanList";
import GrupoEditor from "@/components/scheduling/GrupoEditor";
import { listPeriodos } from "@/services/academics";
import { listCalendarios } from "@/services/scheduling";

export default function PlanificacionPage() {
  const [editing, setEditing] = useState<{ grupoId: number; calendarioId: number } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [periodoId, setPeriodoId] = useState<number | null>(null);
  const [calendarioId, setCalendarioId] = useState<number | null>(null);

  // Cargar periodos y seleccionar el más reciente
  useEffect(() => {
    (async () => {
      const data = await listPeriodos();
      const arr = Array.isArray(data) ? data : (data?.results ?? []);
      if (arr?.length) {
        const ordenados = [...arr].sort((a, b) => b.gestion - a.gestion || b.numero - a.numero);
        setPeriodoId(ordenados[0].id ?? null);
      }
    })();
  }, []);

  // Cada vez que cambia el periodo, obtener el último calendario disponible
  useEffect(() => {
    (async () => {
      if (!periodoId) return;
      const data = await listCalendarios();
      const arr = Array.isArray(data) ? data : (data ?? []);
      // Filtra los calendarios que pertenecen al periodo seleccionado
      const filtrados = arr.filter((c) => c.periodo === periodoId);
      if (filtrados.length) {
        // selecciona el de mayor id (último creado)
        const ultimo = filtrados.sort((a, b) => b.id - a.id)[0];
        setCalendarioId(ultimo.id);
      } else {
        setCalendarioId(null);
      }
    })();
  }, [periodoId]);

  return (
    <div className="container-fluid py-3">
      <h1 className="h4 mb-3">Planificación de grupos</h1>

      {/* Si no hay calendario disponible para el periodo */}
      {!calendarioId && periodoId && (
        <div className="alert alert-warning mb-3">
          No hay calendarios asociados al período seleccionado.
        </div>
      )}

      {!editing && (
        <div key={`list-${refreshKey}`}>
          <GruposPlanList
            periodoId={periodoId}
            onPeriodoChange={setPeriodoId}
            onEdit={(grupoId) => {
              if (calendarioId) {
                setEditing({ grupoId, calendarioId });
                console.log({ grupoId, calendarioId });
              }
            }}
          />
        </div>
      )}

      {editing && calendarioId && (
        <GrupoEditor
          groupId={editing.grupoId}
          calendarioId={editing.calendarioId}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
