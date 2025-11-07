'use client';

import { useEffect, useState, useMemo } from 'react';
import { listCalendarios, listBloques } from '@/services/scheduling';
import { http } from '@/lib/http';
import type { Calendario, Bloque } from '@/types/scheduling';
import type { Docente } from '@/types/users';
import DisponibilidadGrid from '@/components/scheduling/DisponibilidadGrid';
import { useAuth } from '@/context/AuthContext';

export default function DisponibilidadPage() {
  const { role, user } = useAuth();
  const isDocente = role === 'DOCENTE';

  const [cals, setCals] = useState<Calendario[]>([]);
  const [selCal, setSelCal] = useState<number | undefined>();
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [selDoc, setSelDoc] = useState<number | undefined>();
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [meDocenteMissing, setMeDocenteMissing] = useState(false);

  // Carga inicial: calendarios + docentes (ajustado por rol)
  useEffect(() => {
    (async () => {
      try {
        const [calList, docentesResp] = await Promise.all([
          listCalendarios(),
          http.get<Docente[]>('/api/users/docentes/'),
        ]);

        setCals(calList);
        setSelCal(calList[0]?.id);

        const allDocs = docentesResp.data ?? [];

        if (isDocente) {
          // Buscar el docente vinculado al usuario logueado
          const mine = allDocs.find((d: any) => d.user === user?.id);
          console.log(allDocs, user?.id);
          if (!mine) {
            setMeDocenteMissing(true);
            setDocentes([]);
            setSelDoc(undefined);
          } else {
            setDocentes([mine]);
            setSelDoc(mine.id);
          }
        } else {
          // Jefe / Vicerrectorado / etc.
          setDocentes(allDocs);
          setSelDoc(allDocs[0]?.id);
        }
      } catch (e: any) {
        setError('No se pudo cargar datos iniciales.');
      }
    })();
  }, [isDocente, user?.id]);

  // Cargar bloques del calendario seleccionado
  useEffect(() => {
    (async () => {
      if (!selCal) return;
      try {
        const bs = await listBloques(selCal);
        setBloques(bs);
      } catch (e: any) {
        setError('No se pudieron cargar bloques.');
      }
    })();
  }, [selCal]);

  const docenteNombre = useMemo(() => {
    if (!selDoc) return '';
    const d = docentes.find((x) => x.id === selDoc);
    return d?.nombre_completo ?? `Docente #${selDoc}`;
  }, [docentes, selDoc]);

  return (
    <div className="container py-3">
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label">Calendario</label>
          <select
            className="form-select"
            value={selCal ?? ''}
            onChange={(e) => setSelCal(Number(e.target.value))}
          >
            {cals.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre || `Calendario ${c.id}`} — Período {c.periodo}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">Docente</label>

          {/* Modo docente: campo bloqueado (sin posibilidad de cambiar) */}
          {isDocente ? (
            <>
              <input
                className="form-control"
                value={meDocenteMissing ? 'No vinculado a un docente' : docenteNombre || '—'}
                disabled
                readOnly
              />
              {meDocenteMissing && (
                <div className="form-text text-danger">
                  Tu usuario no está vinculado a un registro de Docente. Contacta con administración.
                </div>
              )}
            </>
          ) : (
            <select
              className="form-select"
              value={selDoc ?? ''}
              onChange={(e) => setSelDoc(Number(e.target.value))}
            >
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre_completo}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {selCal && selDoc && bloques.length > 0 ? (
        <DisponibilidadGrid calendarioId={selCal} docenteId={selDoc} bloques={bloques} />
      ) : (
        <div className="alert alert-info">
          {(!selCal || bloques.length === 0)
            ? 'Asegúrate de que el calendario tenga bloques.'
            : isDocente && meDocenteMissing
              ? 'No es posible editar disponibilidad porque tu usuario no está vinculado a un docente.'
              : 'Selecciona un calendario y un docente.'}
        </div>
      )}
    </div>
  );
}
