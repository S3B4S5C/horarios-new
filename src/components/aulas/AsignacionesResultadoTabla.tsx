'use client';
import React from 'react';
import type { AsignarAulasItem } from '@/services/aulas';

type Maps = {
  claseLabel: Record<number, string>;
  ambienteLabel: Record<number, string>;
};

function badgeClass(s: AsignarAulasItem['estado']) {
  switch (s) {
    case 'asignado': return 'badge bg-success';
    case 'sin_candidatos': return 'badge bg-warning text-dark';
    case 'conflicto': return 'badge bg-danger';
    default: return 'badge bg-secondary';
  }
}

export default function AsignacionesResultadoTabla({
  items, maps,
}: { items: AsignarAulasItem[]; maps: Maps }) {
  const counts = items.reduce((acc, it) => {
    acc[it.estado] = (acc[it.estado] || 0) + 1; return acc;
  }, {} as Record<string, number>);

  return (
    <div className="mt-4">
      <div className="d-flex flex-wrap gap-2 mb-2 small">
        <span className="badge bg-success">asignado: {counts['asignado'] || 0}</span>
        <span className="badge bg-warning text-dark">sin candidatos: {counts['sin_candidatos'] || 0}</span>
        <span className="badge bg-danger">conflicto: {counts['conflicto'] || 0}</span>
        <span className="badge bg-secondary">omitido: {counts['omitido'] || 0}</span>
      </div>

      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>Clase</th>
              <th>Ambiente anterior</th>
              <th>Ambiente nuevo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>{maps.claseLabel[it.clase] ?? `Clase #${it.clase}`}</td>
                <td>{it.ambiente_anterior ? (maps.ambienteLabel[it.ambiente_anterior] ?? `Amb. #${it.ambiente_anterior}`) : '—'}</td>
                <td>{it.ambiente_nuevo ? (maps.ambienteLabel[it.ambiente_nuevo] ?? `Amb. #${it.ambiente_nuevo}`) : '—'}</td>
                <td><span className={badgeClass(it.estado)}>{it.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && <p className="text-muted small mb-0">No hubo cambios.</p>}
    </div>
  );
}
