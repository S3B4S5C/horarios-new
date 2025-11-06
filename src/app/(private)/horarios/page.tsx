"use client";
import React from "react";
import AsignacionDocente from "@/components/scheduling/AsignacionDocentes";
import ConflictosPanel from "@/components/scheduling/ConflictosPanel";
import CargasDocentes from "@/components/scheduling/CargasDocentes";

export default function PageOptimizacion() {
  return (
    <main className="container py-4">
      <header className="mb-3">
        <h1 className="h4 mb-1">Optimización de Horarios</h1>
        <p className="text-muted">
          Asignación de docentes · Detección de conflictos · Carga de horas
        </p>
      </header>
      <AsignacionDocente />
      <ConflictosPanel />
      <CargasDocentes />
    </main>
  );
}
