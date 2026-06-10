import Link from 'next/link';

export default function RootNotFound() {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui,-apple-system,sans-serif', background: 'linear-gradient(135deg,#f0f4ff 0%,#e8effe 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          {/* 404 grande */}
          <p style={{ fontSize: '8rem', fontWeight: 900, color: '#bfdbfe', lineHeight: 1, margin: '0 0 -2.5rem' }}>404</p>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '18px' }}>N</span>
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>NeoCore</span>
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', margin: '0 0 12px' }}>Página no encontrada</h1>
          <p style={{ color: '#64748b', marginBottom: '32px', lineHeight: 1.6, fontSize: '15px' }}>
            La dirección que buscas no existe o ha sido movida.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/es" style={{ padding: '12px 28px', background: '#1d4ed8', color: '#fff', borderRadius: '12px', fontWeight: 600, textDecoration: 'none', fontSize: '15px', display: 'inline-block' }}>
              Ir al inicio
            </Link>
            <Link href="/es/services" style={{ padding: '12px 28px', background: '#fff', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 600, textDecoration: 'none', fontSize: '15px', display: 'inline-block' }}>
              Ver servicios
            </Link>
          </div>

          <p style={{ marginTop: '40px', fontSize: '12px', color: '#94a3b8' }}>
            Error 404 · <a href="mailto:info@neocoree.xyz" style={{ color: '#60a5fa', textDecoration: 'none' }}>¿Necesitas ayuda?</a>
          </p>
        </div>
      </body>
    </html>
  );
}
