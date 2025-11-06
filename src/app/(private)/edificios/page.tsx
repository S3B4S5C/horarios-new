'use client';
import { useEffect, useState } from 'react';
import { createEdificio, deleteEdificio, listEdificios, updateEdificio } from '@/services/facilities';
import type { Edificio } from '@/types/facilities';
import EdificioForm from '@/components/facilities/EdificioForm';

export default function EdificiosPage() {
  const [items, setItems] = useState<Edificio[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Edificio|undefined>();
  const [error, setError] = useState<string|undefined>();

  async function refresh() {
    setLoading(true);
    try { setItems(await listEdificios()); }
    catch (e: any) { setError(e?.response?.data?.detail || 'Error al cargar.'); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ refresh(); },[]);

  async function handleCreate(payload: Omit<Edificio,'id'>) {
    try { await createEdificio(payload); await refresh(); setEditing(undefined);} 
    catch (e: any) { setError(e?.response?.data?.detail || 'No se pudo crear.'); }
  }
  async function handleUpdate(payload: Omit<Edificio,'id'>) {
    if (!editing) return;
    try { await updateEdificio(editing.id, payload); await refresh(); setEditing(undefined);} 
    catch (e: any) { setError(e?.response?.data?.detail || 'No se pudo actualizar.'); }
  }
  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar edificio?')) return;
    try { await deleteEdificio(id); await refresh(); } 
    catch (e: any) { setError(e?.response?.data?.detail || 'No se pudo eliminar.'); }
  }

  return (
      <div className="container py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 m-0">CRUD de edificios</h2>
          <button className="btn btn-success" onClick={()=>setEditing({ id: -1, codigo:'', nombre:'', ubicacion:'' })}>Nuevo</button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {loading ? <div>Cargando...</div> : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Código</th><th>Nombre</th><th>Ubicación</th><th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it=> (
                  <tr key={it.id}>
                    <td>{it.codigo}</td>
                    <td>{it.nombre}</td>
                    <td>{it.ubicacion || '-'}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={()=>setEditing(it)}>Editar</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={()=>handleDelete(it.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal simple inline */}
        {editing && (
          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h5 className="card-title">{editing.id === -1 ? 'Crear edificio' : 'Editar edificio'}</h5>
              <EdificioForm
                initial={editing.id === -1 ? undefined : editing}
                existentes={items}
                onSubmit={editing.id === -1 ? handleCreate : handleUpdate}
                onCancel={()=>setEditing(undefined)}
              />
            </div>
          </div>
        )}
      </div>
  );
}
