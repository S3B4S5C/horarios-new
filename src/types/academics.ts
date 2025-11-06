export interface Carrera {
  id?: number;
  sigla: string;
  nombre: string;
  jefe?: number | null; // user id con role JEFE_CARRERA
}

export interface TipoAmbienteAcademics {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Asignatura {
  id: number;
  carrera: number;
  codigo: string;
  nombre: string;
  horas_teoria_semana?: number;
  horas_practica_semana?: number;
  tipo_ambiente_teoria?: number | null;
  tipo_ambiente_practica?: number | null;
}

export interface Periodo {
  id?: number;
  gestion: number; // año
  numero: number;  // 1 o 2
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string;    // YYYY-MM-DD
}

export interface Turno {
  id?: number;
  nombre: string; // Mañana/Tarde/Noche
}

export type GrupoEstado = 'borrador' | 'confirmado' | 'cerrado';

export interface Grupo {
  id?: number;
  asignatura: number;
  periodo: number;
  turno: number;
  docente?: number | null; // users.Docente id
  codigo?: string | null;  // A1, B2...
  capacidad?: number;
  estado?: GrupoEstado;
}

export interface Preinscripcion {
  id?: number;
  periodo: number;
  asignatura: number;
  turno: number;
  estudiante: number; // users.Estudiante id
  creado_en?: string; // ISO datetime
}

export interface Inscripcion {
  id?: number;
  grupo: number;
  estudiante: number;
  fecha?: string; // ISO datetime
}