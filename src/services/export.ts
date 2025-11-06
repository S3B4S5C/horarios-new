import { http } from "@/lib/http";

export type ExportFiltros = {
  periodo: number;
  calendario: number;
  docente?: number;
  grupo?: number;
  ambiente?: number;
};

export type GridBloque = {
  id: number;
  orden: number;
  hora_inicio: string; // "HH:MM:SS"
  hora_fin: string;
  duracion_min: number;
};

export type GridCell = {
  day_of_week: number;
  bloque_inicio_orden: number;
  bloques_duracion: number;
  clase_id: number;
  grupo_id: number;
  asignatura_id: number;
  docente_id: number;
  ambiente_id: number | null;
  asignatura: string;
  grupo_codigo: string;
  docente: string;
  ambiente: string | null;
  tipo: "T" | "P";
  color: string;
};

export type GridResponse = {
  calendario: number;
  periodo: number;
  dias: number[];
  bloques: GridBloque[];
  celdas: GridCell[];
};

export async function gridSemana(params: ExportFiltros): Promise<GridResponse> {
  const payload = {
    periodo: params.periodo,
    calendario: params.calendario,
    docente: params.docente,
    grupo: params.grupo,
    ambiente: params.ambiente,
  };
  const { data } = await http.post("/api/scheduling/grid/semana/", payload);
  return data as GridResponse;
}

export async function exportHorarioPDF(params: ExportFiltros): Promise<Blob> {
  const { data } = await http.get("/api/scheduling/export/pdf/", {
    params,
    responseType: "blob",
  });
  return data as Blob;
}
