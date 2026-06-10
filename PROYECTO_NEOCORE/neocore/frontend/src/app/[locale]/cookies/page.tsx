import Link from 'next/link';
import { ArrowLeft, Cookie } from 'lucide-react';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/es" className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-5">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Cookie className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold">Política de Cookies</h1>
          </div>
          <p className="text-blue-200">Última actualización: enero 2026</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-12">
        <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-8">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">¿Qué son las cookies?</h2>
            <p className="text-gray-600">Las cookies son pequeños archivos de texto que los sitios web almacenan en tu navegador. NeoCore usa un número mínimo de cookies, todas necesarias para el funcionamiento de la plataforma.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Cookies que usamos</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 border border-gray-200 font-semibold text-gray-700">Nombre</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold text-gray-700">Tipo</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold text-gray-700">Duración</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold text-gray-700">Finalidad</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr>
                    <td className="p-3 border border-gray-100 font-mono text-xs">access_token</td>
                    <td className="p-3 border border-gray-100">LocalStorage</td>
                    <td className="p-3 border border-gray-100">15 minutos</td>
                    <td className="p-3 border border-gray-100">Token de autenticación JWT</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-100 font-mono text-xs">refresh_token</td>
                    <td className="p-3 border border-gray-100">LocalStorage</td>
                    <td className="p-3 border border-gray-100">7 días</td>
                    <td className="p-3 border border-gray-100">Renovar la sesión sin reautenticarse</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-100 font-mono text-xs">pending_booking</td>
                    <td className="p-3 border border-gray-100">LocalStorage</td>
                    <td className="p-3 border border-gray-100">Hasta completar reserva</td>
                    <td className="p-3 border border-gray-100">Guardar selección de reserva antes de iniciar sesión</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-500 text-sm mt-3">Nota: usamos <strong>localStorage</strong> (almacenamiento local del navegador), no cookies HTTP tradicionales, para los tokens de sesión.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Cookies de terceros</h2>
            <p className="text-gray-600">NeoCore <strong>no usa</strong> cookies de seguimiento, publicidad ni analítica de terceros (Google Analytics, Facebook Pixel, etc.). No compartimos tu comportamiento de navegación con ninguna empresa externa.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Cómo gestionar las cookies</h2>
            <p className="text-gray-600 mb-3">Puedes eliminar el almacenamiento local de NeoCore desde la configuración de tu navegador:</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-1 text-sm">
              <li><strong>Chrome:</strong> Ajustes → Privacidad y seguridad → Cookies y otros datos de sitios</li>
              <li><strong>Firefox:</strong> Preferencias → Privacidad y seguridad → Cookies y datos del sitio</li>
              <li><strong>Safari:</strong> Preferencias → Privacidad → Gestionar datos de sitios web</li>
            </ul>
            <p className="text-gray-500 text-sm mt-3">Si eliminas los tokens de sesión, tendrás que iniciar sesión de nuevo.</p>
          </section>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-blue-800">
            <p>¿Preguntas sobre cookies? <a href="mailto:info@neocoree.xyz" className="font-semibold hover:underline">info@neocoree.xyz</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
