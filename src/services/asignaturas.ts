import { http } from '@/lib/http';
import type { Asignatura } from '@/types';

export async function listAsignaturas() {
  const { data } = await http.get<Asignatura[]>('/api/academics/asignaturas/');
  return data;
}

export type AsignaturaCreate = {
  carrera: number; codigo: string; nombre: string;
  horas_teoria_semana?: number; horas_practica_semana?: number;
  tipo_ambiente_teoria?: number | null; tipo_ambiente_practica?: number | null;
};

export async function createAsignatura(body: AsignaturaCreate) {
  const { data } = await http.post<Asignatura>('/api/academics/asignaturas/create/', body);
  return data;
}

export async function patchAsignatura(id: number, body: Partial<AsignaturaCreate>) {
  const { data } = await http.patch<Asignatura>(`/api/academics/asignaturas/${id}/update/`, body);
  return data;
}

export async function deleteAsignatura(id: number) {
  await http.delete(`/api/academics/asignaturas/${id}/delete/`);
}