export type UserRole = 'JEFE_CARRERA' | 'VICERRECTORADO' | 'RECTOR' | 'DOCENTE' | 'ESTUDIANTE';

export interface UserProfile {
  role: UserRole;
  permisos?: Record<string, any>;
}

export interface Docente {
  id: number;
  nombre_completo: string;
  especialidad?: string;
  carga_min_semanal?: number;
  carga_max_semanal?: number;
  activo?: boolean;
}

export interface Estudiante {
  id: number;
  nombre_completo: string;
  matricula: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  date_joined?: string; // ISO
  is_active?: boolean;
  profile: UserProfile;
  docente?: Docente | null;
  estudiante?: Estudiante | null;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export type LoginRequest =
  | { username: string; password: string; email?: never }
  | { email: string; password: string; username?: never };

export interface AssignRoleRequest {
  user_id: number;
  role: UserRole;
  permisos?: Record<string, any>;
}