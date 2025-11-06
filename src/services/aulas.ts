import { http } from '@/lib/http';

export type AsignarAulasRequest = {
  periodo: number;
  calendario: number;
  clase_ids?: number[];
  prefer_edificio?: number;
  force?: boolean;
};

export type AsignarAulasItem = {
  clase: number;
  ambiente_anterior: number | null;
  ambiente_nuevo: number | null;
  estado: 'asignado' | 'sin_candidatos' | 'omitido' | 'conflicto';
};

export type AsignarAulasResponse = { asignaciones: AsignarAulasItem[] };

export async function asignarAulas(payload: AsignarAulasRequest) {
  const { data } = await http.post<AsignarAulasResponse>(
    '/api/scheduling/aulas/asignar/',
    payload
  );
  return data;
}