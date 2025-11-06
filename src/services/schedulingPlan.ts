import { http } from '@/lib/http';

export type GrupoPlanRow = {
  grupo: number;
  codigo: string | null;
  periodo: number;
  turno: number;
  asignatura: { id: number; codigo: string; nombre: string };
  programado: {
    teoria: { bloques: number; minutos: number; horas: number };
    practica: { bloques: number; minutos: number; horas: number };
  };
  requeridos: {
    teoria_horas_semana: number;
    practica_horas_semana: number;
  };
  estado: { teoria: 'OK' | 'BAJO' | 'EXCESO'; practica: 'OK' | 'BAJO' | 'EXCESO' };
};

export type ClaseDetail = {
  id: number;
  grupo: number;
  tipo: 'T'|'P';
  day_of_week: 1|2|3|4|5|6|7;
  bloque_inicio: number; // id de bloque
  bloques_duracion: number;
  ambiente: number;
  docente?: number | null;
  estado: 'propuesto'|'confirmado'|'cancelado';
  labels?: {
    asignatura: string;
    grupo: string|null;
    docente: string;
    ambiente: string|null;
    bloque_inicio_orden: number;
    rango_hora: string;
  };
};

export async function listGruposPlanificacion(params?: {
  periodo?: number|string;
  asignatura?: number|string;
  turno?: number|string;
  tolerancia_min?: number;
  calendario?: number;
}) {
  const { data } = await http.get('/api/academics/grupos/planificacion/', { params });
  return data as GrupoPlanRow[];
}

export async function listClasesDeGrupo(grupoId: number, expandLabels = true) {
  const { data } = await http.get(`/api/academics/grupos/${grupoId}/clases/`, {
    params: expandLabels ? { expand: 'labels' } : undefined,
  });
  return data as ClaseDetail[];
}

export async function bulkCreateClases(items: Omit<ClaseDetail,'id'|'labels'>[]) {
  const { data } = await http.post('/api/academics/clases/bulk-create/', { items });
  return data as { created: number; items: ClaseDetail[]; conflicts: any[] };
}

export async function bulkDeleteClases(ids: number[]) {
  const { data } = await http.post('/api/academics/clases/bulk-delete/', { ids });
  return data as { deleted: number; not_found: number[] };
}