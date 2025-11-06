'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AxiosError } from 'axios';

type ErrorPayload = { detail?: string; intentos_restantes?: number };

export default function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      const ax = err as AxiosError<ErrorPayload>;
      const status = ax.response?.status;
      const payload = ax.response?.data;
      if (status === 423) {
        setError(payload?.detail ?? 'Cuenta/IP bloqueada temporalmente.');
      } else if (status === 401) {
        const rest = payload?.intentos_restantes;
        setError(`Credenciales inválidas.${typeof rest === 'number' ? ` Intentos restantes: ${rest}.` : ''}`);
      } else {
        setError(payload?.detail ?? 'Error al iniciar sesión.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-7 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h1 className="h4 mb-3 text-center">Iniciar sesión</h1>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={onSubmit} className="d-grid gap-3">
                <div>
                  <label className="form-label">Usuario o Email</label>
                  <input
                    className="form-control"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="doc1 ó doc1@uni.edu"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Ingresando…' : 'Ingresar'}
                </button>
              </form>
            </div>
          </div>
          <p className="text-center mt-3 text-muted small">
            Acceso sólo para administración universitaria.
          </p>
        </div>
      </div>
    </div>
  );
}