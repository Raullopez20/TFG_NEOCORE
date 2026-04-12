'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, CheckCircle, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);
      // dj-rest-auth puede devolver 'access_token'/'refresh_token' o 'access'/'refresh'
      localStorage.setItem('access_token', response.access_token || response.access);
      localStorage.setItem('refresh_token', response.refresh_token || response.refresh);
      router.push('/es/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.non_field_errors?.[0] || err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Panel - Brand Showcase */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex-col items-center justify-center p-12">
        {/* Floating gradient orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 text-center space-y-8">
          {/* Logo & Tagline */}
          <div>
            <h2 className="text-4xl font-bold text-white tracking-tight">NeoCore</h2>
            <p className="text-blue-300 text-lg mt-2">Centro de Salud y Bienestar</p>
          </div>

          {/* Feature bullet points */}
          <div className="space-y-4 mt-12 text-left max-w-xs mx-auto">
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-sm">Gestion integral de pacientes</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-sm">Citas y reservas en tiempo real</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-sm">Panel de control avanzado</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-sm">Seguridad y privacidad garantizada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex items-center justify-center bg-white p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Back link */}
          <Link
            href="/es"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors mb-8 inline-block"
          >
            &larr; Volver al inicio
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Bienvenido de nuevo</h1>
            <p className="text-gray-500 mt-2">Inicia sesion en tu cuenta</p>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-700"
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Registro exitoso. Ya puedes iniciar sesion.</span>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-600"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo Electronico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-premium"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contrasena
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-premium pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Recordarme</span>
              </label>
              <Link
                href="/es/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Olvidaste tu contrasena?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white rounded-xl py-3 font-medium hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">o</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              No tienes una cuenta?{' '}
              <Link href="/es/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Registrate gratis
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
