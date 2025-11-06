export interface Calendario {
  id: number;
  periodo: number;
  nombre?: string;
  duracion_bloque_min?: number; // 45 por defecto
}

export interface Bloque {
  id: number;
  calendario: number;
  orden: number;
  hora_inicio: string; // HH:mm:ss
  hora_fin: string;    // HH:mm:ss
  duracion_min: number;
}

export type DiaSemana = 1 | 2 | 3 | 4 | 5 | 6 | 7; // Lunes..Domingo

export interface DisponibilidadDocente {
  id: number;
  docente: number;
  calendario: number;
  day_of_week: DiaSemana;
  bloque_inicio: number;      // Bloque id
  bloques_duracion?: number;  // default 1
  preferencia?: number;       // peso
}

export type ClaseTipo = 'T' | 'P';
export type ClaseEstado = 'propuesto' | 'confirmado' | 'cancelado';

export interface ClaseDetail {
  id: number;
  grupo: number;        // academics.Grupo id
  tipo: ClaseTipo;
  day_of_week: DiaSemana;
  bloque_inicio: number;     // Bloque id
  bloques_duracion?: number;
  ambiente: number;     // facilities.Ambiente id
  docente?: number;      // users.Docente id
  estado?: ClaseEstado;
}

export type ConflictoTipo = 'DOCENTE' | 'AMBIENTE' | 'GRUPO';

export interface ConflictoHorario {
  id: number;
  tipo: ConflictoTipo;
  clase_a: number;
  clase_b: number;
  resuelto?: boolean;
  nota?: string;
  detectado_en?: string; // ISO
}

export interface CambioHorario {
  id?: number;
  clase: number;         // Clase id
  usuario?: number | null; // auth.User id
  motivo?: string;
  old_day_of_week?: DiaSemana | null;
  old_bloque_inicio?: number | null; // Bloque id
  old_bloques_duracion?: number | null;
  old_ambiente?: number | null;      // Ambiente id
  old_docente?: number | null;       // Docente id
  new_day_of_week?: DiaSemana | null;
  new_bloque_inicio?: number | null; // Bloque id
  new_bloques_duracion?: number | null;
  new_ambiente?: number | null;      // Ambiente id
  new_docente?: number | null;       // Docente id
  fecha?: string; // ISO
}

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7; // L-D


export interface GrupoDocenteSugerencia {
  grupo: number;
  docente_sugerido: number | null;
  motivo: string;
}
export interface PropuestaDocenteRequest {
  periodo: number;
  calendario: number;
  asignatura?: number;
  turno?: number;
  persistir?: boolean;
  prefer_especialidad?: boolean;
}
export interface PropuestaDocenteResponse {
  sugerencias: GrupoDocenteSugerencia[];
}

export interface Conflicto {
  id: number;
  tipo: ConflictoTipo;
  clase_a: number;
  clase_b: number;
  resuelto?: boolean;
  nota?: string;
  detectado_en?: string;
}
export interface DetectarConflictosRequest {
  periodo: number;
  calendario?: number;
  persistir?: boolean; // por defecto true en backend
}

export interface DragDropMoveRequest {
  clase: number;
  new_day_of_week: DayOfWeek;
  new_bloque_inicio: number;
  new_bloques_duracion?: number; // default 1
  motivo?: string;
  dry_run?: boolean; // default false
}
export interface DragDropMoveResponse {
  updated: boolean;
  clase: ClaseDetail;
  conflictos: any[];
}


export type CargaEstado = "BAJO" | "OK" | "EXCESO";
export interface CargaDocenteItem {
  docente: number;
  nombre: string;
  horas_45: number;
  carga_min_semanal: number;
  carga_max_semanal: number;
  estado: CargaEstado;
  clases: number;
}
export interface CargaDocenteResponse {
  periodo: number;
  calendario: number;
  items: CargaDocenteItem[];
}


// Aux
export interface GridBloque { id: number; orden: number; hora_inicio: string; hora_fin: string; duracion_min: number }
export interface GridCell {
  day_of_week: number; bloque_inicio_orden: number; bloques_duracion: number;
  clase_id: number; grupo_id: number; asignatura_id: number; docente_id: number;
  ambiente_id: number | null; asignatura: string; grupo_codigo: string; docente: string; ambiente: string | null; tipo: string; color: string;
}
export interface GridResponse { calendario: number; periodo: number; dias: number[]; bloques: GridBloque[]; celdas: GridCell[]; }
export interface GridRequest { periodo: number; calendario: number; docente?: number; grupo?: number; ambiente?: number; bloque_min?: number; bloque_max?: number; }