'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, KeyRound, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;
  const token = params.token as string;

  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password1 !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password1.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.confirmPasswordReset(uid, token, password1, password2);
      setDone(true);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.token || data?.uid) {
        setError('El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.');
      } else if (data?.new_password2) {
        const msgs = Array.isArray(data.new_password2) ? data.new_password2 : [data.new_password2];
        setError(msgs.join(' '));
      } else if (data?.detail) {
        setError(Array.isArray(data.detail) ? data.detail.join(' ') : data.detail);
      } else {
        setError('No se pudo restablecer la contraseña. Inténtalo de nuevo.');
      }
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Nueva contraseña</h1>
            <p className="text-gray-600">Elige una contraseña segura para tu cuenta</p>
          </div>

          {done ? (
            <div className="text-center space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">
                  ¡Contraseña actualizada correctamente! Ya puedes iniciar sesión.
                </span>
              </div>
              <Button
                onClick={() => router.push('/es/login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
              >
                Ir a iniciar sesión
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password1}
                      onChange={(e) => setPassword1(e.target.value)}
                      required
                      minLength={8}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      required
                      minLength={8}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
