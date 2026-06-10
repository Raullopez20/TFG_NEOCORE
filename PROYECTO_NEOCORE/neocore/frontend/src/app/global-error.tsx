'use client';

import { useEffect } from 'react';

// global-error reemplaza el layout raíz cuando hay un error crítico,
// por eso necesita su propio <html> y <body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[NeoCore GlobalError]', error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '7rem', fontWeight: 900, color: '#fecaca', lineHeight: 1 }}>!</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>N</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>NeoCore</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>Error crítico</h1>
            <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
              Se ha producido un error crítico en la aplicación.
              Por favor recarga la página o vuelve al inicio.
            </p>
            {error.digest && (
              <p style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginBottom: '20px' }}>
                Ref: {error.digest}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{ padding: '10px 24px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
              >
                Recargar
              </button>
              <a
                href="/es"
                style={{ padding: '10px 24px', background: '#fff', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}
              >
                Ir al inicio
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
