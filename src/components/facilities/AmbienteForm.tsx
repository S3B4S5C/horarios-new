'use client';
import { useMemo, useState } from 'react';
import type { Ambiente, Edificio, TipoAmbiente } from '@/types/facilities';

interface Props {
  initial?: Partial<Ambiente>;
  existentes: Ambiente[];
  edificios: Edificio[];
  tipos: TipoAmbiente[];
  onSubmit: (payload: Omit<Ambiente,'id'>) => Promise<void>;
  onCancel?: () => void;
}

export default function AmbienteForm({ initial, existentes, edificios, tipos, onSubmit, onCancel }: Props) {
  const [edificio, setEdificio] = useState<number>(initial?.edificio ?? (edificios[0]?.id ?? 0));
  const [tipo, setTipo] = useState<number>(initial?.tipo_ambiente ?? (tipos[0]?.id ?? 0));
  const [codigo, setCodigo] = useState(initial?.codigo ?? '');
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [capacidad, setCapacidad] = useState<number>(initial?.capacidad ?? 30);
  const [error, setError] = useState<string|undefined>();

  const duplicado = useMemo(() => existentes.some(a => a.edificio === edificio && a.codigo.trim().toUpperCase() === codigo.trim().toUpperCase() && a.id !== (initial?.id ?? -1)), [existentes, edificio, codigo, initial?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!edificio || !tipo || !codigo || !nombre) { setError('Todos los campos son obligatorios.'); return; }
    if (capacidad <= 0) { setError('Capacidad debe ser > 0.'); return; }
    if (duplicado) { setError('Ya existe un ambiente con ese código en el edificio.'); return; }
    await onSubmit({ edificio, tipo_ambiente: tipo, codigo: codigo.trim(), nombre: nombre.trim(), capacidad });
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label">Edificio</label>
          <select className="form-select" value={edificio} onChange={e=>setEdificio(Number(e.target.value))}>
            {edificios.map(e=> <option key={e.id} value={e.id}>{e.codigo} — {e.nombre}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Tipo</label>
          <select className="form-select" value={tipo} onChange={e=>setTipo(Number(e.target.value))}>
            {tipos.map(t=> <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Capacidad</label>
          <input type="number" min={1} className="form-control" value={capacidad} onChange={e=>setCapacidad(Number(e.target.value))} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Código</label>
          <input className="form-control" value={codigo} onChange={e=>setCodigo(e.target.value)} maxLength={30} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Nombre</label>
          <input className="form-control" value={nombre} onChange={e=>setNombre(e.target.value)} maxLength={120} />
        </div>
      </div>
      <div className="d-flex gap-2 mt-3">
        <button type="submit" className="btn btn-primary">Guardar</button>
        {onCancel && <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
}
