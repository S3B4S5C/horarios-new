'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Edificio } from '@/types/facilities';

interface Props {
  initial?: Partial<Edificio>;
  existentes: Edificio[];
  onSubmit: (payload: Omit<Edificio,'id'>) => Promise<void>;
  onCancel?: () => void;
}

export default function EdificioForm({ initial, existentes, onSubmit, onCancel }: Props) {
  const [codigo, setCodigo] = useState(initial?.codigo ?? '');
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [ubicacion, setUbicacion] = useState(initial?.ubicacion ?? '');
  const [error, setError] = useState<string|undefined>();
  const duplicado = useMemo(() => existentes.some(e => e.codigo.trim().toUpperCase() === codigo.trim().toUpperCase() && e.id !== (initial?.id ?? -1)), [existentes, codigo, initial?.id]);

  useEffect(() => {
    if (duplicado) setError('El código ya existe.');
    else setError(undefined);
  }, [duplicado]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo || !nombre) {
      setError('Código y nombre son obligatorios.');
      return;
    }
    if (duplicado) return;
    await onSubmit({ codigo: codigo.trim(), nombre: nombre.trim(), ubicacion: ubicacion?.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="needs-validation" noValidate>
      {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
      <div className="mb-3">
        <label className="form-label">Código</label>
        <input className="form-control" value={codigo} onChange={e=>setCodigo(e.target.value)} maxLength={30} required />
      </div>
      <div className="mb-3">
        <label className="form-label">Nombre</label>
        <input className="form-control" value={nombre} onChange={e=>setNombre(e.target.value)} maxLength={120} required />
      </div>
      <div className="mb-3">
        <label className="form-label">Ubicación</label>
        <input className="form-control" value={ubicacion} onChange={e=>setUbicacion(e.target.value)} maxLength={160} />
      </div>
      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-primary">Guardar</button>
        {onCancel && <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
}
