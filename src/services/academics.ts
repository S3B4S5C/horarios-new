import { http } from '@/lib/http';
import type { Asignatura, Grupo, Periodo } from '@/types/academics';

export async function listAsignaturas(): Promise<Asignatura[]> {
  const { data } = await http.get('/api/academics/asignaturas/');
  return data;
}

export async function listGrupos(params?: { asignatura?: number; turno?: string; calendario?: number; periodo?: number}): Promise<Grupo[]> {
  try {
    const { data } = await http.get('/api/academics/grupos/', { params });
    return data as Grupo[];
  } catch (e: any) {
    if (e?.response?.status === 404) throw new Error('ENDPOINT_GRUPOS_FALTANTE');
    throw e;
  }
}
export async function createGrupo(payload: Omit<Grupo,'id'>) {
  try {
    const { data } = await http.post('/api/academics/grupos/create/', payload);
    return data as Grupo;
  } catch (e: any) {
    if (e?.response?.status === 404) throw new Error('ENDPOINT_GRUPOS_FALTANTE');
    throw e;
  }
}
export async function bulkCreateGrupos(items: Omit<Grupo,'id'>[]) {
  try {
    const { data } = await http.post('/api/academics/grupos/bulk-create/', { items });
    return data as { creados: number; ids: number[] };
  } catch (e: any) {
    if (e?.response?.status === 404) throw new Error('ENDPOINT_GRUPOS_FALTANTE');
    throw e;
  }
}

export async function listPeriodos(): Promise<{ results: Periodo[] }> {
  const { data } = await http.get('/api/academics/periodos/');
  return data;
}