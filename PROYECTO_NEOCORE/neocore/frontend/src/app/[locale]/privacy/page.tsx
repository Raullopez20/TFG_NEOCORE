import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/es" className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-5">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold">Política de Privacidad</h1>
          </div>
          <p className="text-blue-200">Última actualización: enero 2026</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-12">
        <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-8 prose prose-slate max-w-none">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Responsable del tratamiento</h2>
            <p className="text-gray-600">NeoCore es el responsable del tratamiento de los datos personales que nos proporciones a través de nuestra plataforma. Puedes contactarnos en <a href="mailto:info@neocoree.xyz" className="text-blue-600 hover:underline">info@neocoree.xyz</a> o en Calle de la Salud, 28, 28013 Madrid.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Datos que recopilamos</h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li><strong>Datos de registro:</strong> nombre, apellidos, correo electrónico, contraseña cifrada y teléfono (encriptados).</li>
              <li><strong>Datos de reserva:</strong> servicio seleccionado, profesional, fecha y hora de la cita, y notas opcionales.</li>
              <li><strong>Datos de uso:</strong> dirección IP (para seguridad y prevención de fraude), logs de acceso.</li>
              <li><strong>Datos de perfil:</strong> foto de perfil (opcional), especialidad y biografía (solo para profesionales).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Finalidad del tratamiento</h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Gestionar el registro y la autenticación de usuarios.</li>
              <li>Permitir la reserva y gestión de citas médicas o de bienestar.</li>
              <li>Enviar notificaciones relacionadas con tus reservas (confirmaciones, recordatorios).</li>
              <li>Garantizar la seguridad de la plataforma y prevenir accesos no autorizados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Base legal</h2>
            <p className="text-gray-600">El tratamiento se basa en el consentimiento explícito que nos otorgas al registrarte (RGPD art. 6.1.a) y en la ejecución del contrato de prestación de servicios (RGPD art. 6.1.b).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Conservación de datos</h2>
            <p className="text-gray-600">Conservamos tus datos mientras tengas una cuenta activa. Si solicitas la eliminación de tu cuenta, eliminaremos o anonimizaremos tus datos en un plazo de 30 días, salvo obligación legal de conservación.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Tus derechos (RGPD)</h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li><strong>Acceso:</strong> puedes solicitar una copia de tus datos desde tu perfil (Exportar datos).</li>
              <li><strong>Rectificación:</strong> puedes corregir tus datos en cualquier momento desde tu perfil.</li>
              <li><strong>Supresión:</strong> puedes eliminar tu cuenta y datos desde tu perfil (Eliminar cuenta).</li>
              <li><strong>Oposición y limitación:</strong> puedes contactarnos en info@neocoree.xyz.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Seguridad</h2>
            <p className="text-gray-600">Aplicamos cifrado AES-256 para datos sensibles (teléfono, biografía), contraseñas con Argon2, tokens JWT con expiración corta, y protección ante ataques de fuerza bruta mediante bloqueo automático.</p>
          </section>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-blue-800">
            <p>¿Tienes preguntas sobre tu privacidad? Escríbenos a <a href="mailto:info@neocoree.xyz" className="font-semibold hover:underline">info@neocoree.xyz</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
