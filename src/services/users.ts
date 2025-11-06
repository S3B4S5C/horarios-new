import { http } from '@/lib/http';
import type { AssignRoleRequest, Docente, User, AuthResponse } from '@/types';

export async function assignRole(payload: AssignRoleRequest) {
  const { data } = await http.post<User>('/api/users/assign-role/', payload);
  return data;
}

export async function listDocentes() {
  const { data } = await http.get<Docente[]>('/api/users/docentes/');
  return data;
}

export type DocenteCU = {
  user: number;
  nombre_completo: string;
  especialidad?: string;
  carga_min_semanal?: number;
  carga_max_semanal?: number;
  activo?: boolean;
};

export async function createDocente(body: DocenteCU) {
  const { data } = await http.post<Docente>('/api/users/docentes/create/', body);
  return data;
}

export async function updateDocente(id: number, body: Partial<DocenteCU>) {
  const { data } = await http.patch<Docente>(`/api/users/docentes/${id}/`, body);
  return data;
}

export async function deleteDocente(id: number) {
  await http.delete(`/api/users/docentes/${id}/delete/`);
}

export type RegisterDocenteBody = {
  username: string; email: string; password: string;
  nombre_completo: string; especialidad?: string;
};

export async function registerDocente(body: RegisterDocenteBody) {
  const { data } = await http.post<AuthResponse>('/api/users/register/', {
    ...body, role: 'DOCENTE'
  });
  return data;
}

// Intento de listado de usuarios base (falta endpoint, se maneja en UI)
export type BasicUser = { id: number; username: string; email?: string };
export async function listUsersBasic(): Promise<BasicUser[]> {
  const { data } = await http.get<BasicUser[]>('/api/users/'); // <- faltante
  return data;
}
