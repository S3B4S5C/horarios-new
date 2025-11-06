import type { Calendario, Bloque, DisponibilidadDocente, PropuestaDocenteRequest, PropuestaDocenteResponse, DetectarConflictosRequest, Conflicto, DragDropMoveRequest, DragDropMoveResponse, CargaDocenteResponse, GridRequest, GridResponse } from '@/types/scheduling';
import { http } from '@/lib/http';

export async function listCalendarios(): Promise<Calendario[]> {
  const { data } = await http.get('/api/scheduling/calendarios/');
  return data;
}
export async function listBloques(calendario?: number): Promise<Bloque[]> {
  const { data } = await http.get('/api/scheduling/bloques/', { params: { calendario } });
  return data;
}
export async function createBloque(payload: Omit<Bloque,'id'>): Promise<Bloque> {
  const { data } = await http.post('/api/scheduling/bloques/create/', payload);
  return data;
}
export async function updateBloque(id: number, payload: Partial<Omit<Bloque,'id'>>): Promise<Bloque> {
  const { data } = await http.put(`/api/scheduling/bloques/${id}/update/`, payload);
  return data;
}
export async function deleteBloque(id: number): Promise<void> {
  await http.delete(`/api/scheduling/bloques/${id}/delete/`);
}

export async function listDisponibilidad(params: { calendario?: number; day?: number; docente?: number; }) {
  const { data } = await http.get('/api/scheduling/disponibilidad/', { params });
  return data as DisponibilidadDocente[];
}
export async function createDisponibilidad(payload: Omit<DisponibilidadDocente,'id'>) {
  const { data } = await http.post('/api/scheduling/disponibilidad/create/', payload);
  return data as DisponibilidadDocente;
}
export async function updateDisponibilidad(id: number, payload: Partial<Omit<DisponibilidadDocente,'id'>>) {
  const { data } = await http.put(`/api/scheduling/disponibilidad/${id}/update/`, payload);
  return data as DisponibilidadDocente;
}
export async function deleteDisponibilidad(id: number) {
  await http.delete(`/api/scheduling/disponibilidad/${id}/delete/`);
}
export async function importDisponibilidadCSV(csv: File | string) {
  // soporte archivo o texto
  if (csv instanceof File) {
    const fd = new FormData();
    fd.append('file', csv);
    const { data } = await http.post('/api/scheduling/disponibilidad/import-csv/', fd, { headers: { 'Content-Type': 'multipart/form-data' }});
    return data;
  } else {
    const { data } = await http.post('/api/scheduling/disponibilidad/import-csv/', csv, { headers: { 'Content-Type': 'text/csv' }});
    return data;
  }
}

export async function proponerDocentes(payload: PropuestaDocenteRequest): Promise<PropuestaDocenteResponse> {
const { data } = await http.post("/api/scheduling/asignacion/docentes/proponer/", payload);
return data as PropuestaDocenteResponse;
}


export async function detectarConflictos(payload: DetectarConflictosRequest): Promise<Conflicto[]> {
const { data } = await http.post("/api/scheduling/conflictos/detectar/", payload);
return data as Conflicto[];
}
export async function listConflictos(): Promise<Conflicto[]> {
const { data } = await http.get("/api/scheduling/conflictos/");
return data as Conflicto[];
}
export async function resolverConflicto(id: number): Promise<Conflicto> {
const { data } = await http.post(`/api/scheduling/conflictos/${id}/resolver/`);
return data as Conflicto;
}
export async function moverClase(payload: DragDropMoveRequest): Promise<DragDropMoveResponse> {
const { data } = await http.post("/api/scheduling/dnd/mover/", payload);
return data as DragDropMoveResponse;
}

export async function cargasDocentes(params: { calendario: number; periodo: number }): Promise<CargaDocenteResponse> {
const { data } = await http.get("/api/scheduling/cargas/docentes/", { params });
return data as CargaDocenteResponse;
}

export async function gridSemana(payload: GridRequest): Promise<GridResponse> {
  const { data } = await http.post("/api/scheduling/grid/semana/", payload);
  return data as GridResponse;
}