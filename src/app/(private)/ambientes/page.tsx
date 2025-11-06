'use client';
import { useEffect, useState } from 'react';
import { listAmbientes, listEdificios, listTiposAmbiente, createAmbiente, updateAmbiente, deleteAmbiente } from '@/services/facilities';
import type { Ambiente } from '@/types/facilities';
import AmbienteForm from '@/components/facilities/AmbienteForm';

export default function AmbientesPage() {
  const [items, setItems] = useState<Ambiente[]>([]);
  const [edificios, setEdificios] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Ambiente|undefined>();
  const [error, setError] = useState<string|undefined>();

  async function refresh() {
    setLoading(true);
    try {
      const [ed, tp, am] = await Promise.all([listEdificios(), listTiposAmbiente(), listAmbientes()]);
      setEdificios(ed); setTipos(tp); setItems(am);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Error al cargar.');
    } finally { setLoading(false); }
  }
  useEffect(()=>{ refresh(); },[]);

  async function handleCreate(payload: Omit<Ambiente,'id'>) {
    try { await createAmbiente(payload); await refresh(); setEditing(undefined);} catch (e:any){ setError('No se pudo crear.'); }
  }
  async function handleUpdate(payload: Omit<Ambiente,'id'>) {
    if (!editing) return; try { await updateAmbiente(editing.id, payload); await refresh(); setEditing(undefined);} catch(e:any){ setError('No se pudo actualizar.'); }
  }
  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar ambiente?')) return; try { await deleteAmbiente(id); await refresh(); } catch(e:any){ setError('No se pudo eliminar.'); }
  }

  return (
      <div className="container py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 m-0">CRUD de ambientes</h2>
          <button className="btn btn-success" onClick={()=>setEditing({ id:-1, edificio:0, tipo_ambiente:0, codigo:'', nombre:'', capacidad:30 })}>Nuevo</button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {loading ? <div>Cargando...</div> : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead><tr>
                <th>Edificio</th><th>Tipo</th><th>Código</th><th>Nombre</th><th>Capacidad</th><th className="text-end">Acciones</th>
              </tr></thead>
              <tbody>
                {items.map(a=> (
                  <tr key={a.id}>
                    <td>{edificios.find((e:any)=>e.id===a.edificio)?.codigo || a.edificio}</td>
                    <td>{tipos.find((t:any)=>t.id===a.tipo_ambiente)?.nombre || a.tipo_ambiente}</td>
                    <td>{a.codigo}</td>
                    <td>{a.nombre}</td>
                    <td>{a.capacidad}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={()=>setEditing(a)}>Editar</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={()=>handleDelete(a.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {editing && (
          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h5 className="card-title">{editing.id === -1 ? 'Crear ambiente' : 'Editar ambiente'}</h5>
              <AmbienteForm
                initial={editing.id === -1 ? undefined : editing}
                existentes={items}
                edificios={edificios}
                tipos={tipos}
                onSubmit={editing.id === -1 ? handleCreate : handleUpdate}
                onCancel={()=>setEditing(undefined)}
              />
            </div>
          </div>
        )}
      </div>
  );
}