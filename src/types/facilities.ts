export interface Edificio {
  id: number;
  codigo: string;
  nombre: string;
  ubicacion?: string;
}

export interface TipoAmbiente {
  id: number;
  nombre: string;     // Aula, Laboratorio, Auditorio...
  descripcion?: string;
}

export interface Ambiente {
  id: number;
  edificio: number;
  tipo_ambiente: number;
  codigo: string;     // ej A-101
  nombre?: string;
  capacidad: number;
}