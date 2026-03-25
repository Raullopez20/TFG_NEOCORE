'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, KeyRound, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.requestPasswordReset(email);
      setSent(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(
        (Array.isArray(detail) ? detail.join(' ') : detail) ||
          err.response?.data?.message ||
          'No se pudo enviar el correo de recuperación'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link
          href="/es/login"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Volver a iniciar sesión
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Recuperar contraseña</h1>
            <p className="text-gray-600">Te enviaremos un enlace para restablecerla</p>
          </div>

          {sent && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">
                Si el correo existe, te hemos enviado instrucciones para recuperar tu contraseña.
              </span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || sent}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
