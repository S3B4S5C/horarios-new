import { http } from '@/lib/http';
import type { TipoAmbiente, Edificio, Ambiente } from '@/types';


export type Carrera = { id: number; sigla: string; nombre: string };


export async function listTiposAmbiente() {
  const { data } = await http.get<TipoAmbiente[]>('/api/facilities/tipos-ambiente/');
  return data;
}

export async function listCarreras(): Promise<Carrera[]> {
  const { data } = await http.get<Carrera[]>('/api/academics/carreras/'); // <- faltante
  return data;
}

export async function listEdificios(): Promise<Edificio[]> {
  const { data } = await http.get('/api/facilities/edificios/');
  return data;
}
export async function createEdificio(payload: Omit<Edificio,'id'>): Promise<Edificio> {
  const { data } = await http.post('/api/facilities/edificios/create/', payload);
  return data;
}
export async function updateEdificio(id: number, payload: Partial<Omit<Edificio,'id'>>): Promise<Edificio> {
  const { data } = await http.put(`/api/facilities/edificios/${id}/update/`, payload);
  return data;
}
export async function deleteEdificio(id: number): Promise<void> {
  await http.delete(`/api/facilities/edificios/${id}/delete/`);
}

export async function listAmbientes(): Promise<Ambiente[]> {
  const { data } = await http.get('/api/facilities/ambientes/');
  return data;
}
export async function createAmbiente(payload: Omit<Ambiente,'id'>): Promise<Ambiente> {
  const { data } = await http.post('/api/facilities/ambientes/create/', payload);
  return data;
}
export async function updateAmbiente(id: number, payload: Partial<Omit<Ambiente,'id'>>): Promise<Ambiente> {
  const { data } = await http.put(`/api/facilities/ambientes/${id}/update/`, payload);
  return data;
}
export async function deleteAmbiente(id: number): Promise<void> {
  await http.delete(`/api/facilities/ambientes/${id}/delete/`);
}


