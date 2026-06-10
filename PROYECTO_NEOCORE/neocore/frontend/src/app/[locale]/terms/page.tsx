import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/es" className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-5">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold">Términos y Condiciones</h1>
          </div>
          <p className="text-blue-200">Última actualización: enero 2026</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-12">
        <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-8">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Aceptación de los términos</h2>
            <p className="text-gray-600">Al registrarte y usar NeoCore aceptas estos términos. Si no estás de acuerdo, no uses el servicio. Nos reservamos el derecho a actualizar estos términos notificándote con 15 días de antelación.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Descripción del servicio</h2>
            <p className="text-gray-600">NeoCore es una plataforma de gestión de reservas para centros de salud y bienestar. Facilitamos la conexión entre clientes y profesionales del sector salud, pero <strong>no somos responsables de los servicios médicos o de bienestar prestados por los profesionales</strong>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Registro y cuenta</h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Debes tener al menos 18 años para registrarte.</li>
              <li>Eres responsable de mantener la seguridad de tu contraseña.</li>
              <li>No puedes crear cuentas falsas ni suplantar a otras personas.</li>
              <li>Una cuenta por persona. Las cuentas duplicadas serán eliminadas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Reservas y cancelaciones</h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Las reservas quedan pendientes hasta que el profesional las confirme.</li>
              <li>Puedes cancelar una reserva confirmada con al menos 24 horas de antelación.</li>
              <li>Los profesionales pueden rechazar reservas sin obligación de justificación.</li>
              <li>NeoCore no gestiona pagos; los acuerdos económicos son entre cliente y profesional.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Uso aceptable</h2>
            <p className="text-gray-600">Queda prohibido: usar la plataforma para fines ilegales, enviar spam, realizar ataques informáticos, publicar contenido ofensivo, o intentar acceder a datos de otros usuarios. El incumplimiento conlleva la suspensión inmediata de la cuenta.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Limitación de responsabilidad</h2>
            <p className="text-gray-600">NeoCore no garantiza la disponibilidad ininterrumpida del servicio. No somos responsables de los servicios prestados por profesionales, ni de daños derivados del uso o imposibilidad de uso de la plataforma.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Ley aplicable</h2>
            <p className="text-gray-600">Estos términos se rigen por la legislación española. Cualquier controversia se someterá a los juzgados y tribunales de Madrid.</p>
          </section>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-blue-800">
            <p>¿Tienes preguntas sobre los términos? Contáctanos en <a href="mailto:info@neocoree.xyz" className="font-semibold hover:underline">info@neocoree.xyz</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
