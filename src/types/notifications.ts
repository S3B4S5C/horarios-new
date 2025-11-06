export interface Notificacion {
  id: number;
  usuario?: number;       // user id
  clase?: number | null;  // Clase id
  titulo: string;
  mensaje: string;
  leida: boolean;
  creada_en: string; // ISO
}