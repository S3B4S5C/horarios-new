// src/services/substitucion.ts
import { http } from '@/lib/http';

export interface ClasePreview {
  id: number;
  grupo: number;
  tipo: 'T'|'P';
  day_of_week: number;
  bloque_inicio: number;
  bloques_duracion: number;
  docente: number|null;
  ambiente: number|null;
  docente_substituto: number|null; // ojo: nombre correcto
}

export async function listClasesCalendario(params: {
  calendario: number;
  docente?: number;
  has_substituto?: boolean;
  grupo?: number;
  asignatura?: number;
}): Promise<ClasePreview[]> {
  const { data } = await http.get('/api/scheduling/clasesPrev/', { params });
  return data;
}

export async function setSubstituto(claseId: number, docente_substituto: number|null) {
  const { data } = await http.patch(`/api/scheduling/clasesPrev/${claseId}/substituto/`, { docente_substituto });
  return data as ClasePreview;
}
