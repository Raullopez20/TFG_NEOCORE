'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      toast.success('Cuenta creada con éxito', {
        description: 'Ya puedes iniciar sesión con tus credenciales.',
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);
      localStorage.setItem('access_token', response.access_token || response.access);
      localStorage.setItem('refresh_token', response.refresh_token || response.refresh);
      toast.success('Sesión iniciada', {
        description: 'Bienvenido de nuevo a NeoCore.',
      });
      router.push('/es/dashboard');
    } catch (err: any) {
      toast.error('No se pudo iniciar sesión', {
        description: err.response?.data?.message || 'Revisa tu correo y contraseña e inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#f5f5f7]">
      {/* Apple-like Ambient Background Blur */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-200/40 mix-blend-multiply filter blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-200/40 mix-blend-multiply filter blur-[140px]" 
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-2xl px-10 py-12 rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white/40"
        >
          {/* Back Nav */}
          <Link
            href="/es"
            className="group flex items-center text-[13px] font-medium text-gray-400 hover:text-gray-800 transition-colors mb-8 -ml-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
            Volver
          </Link>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
              <span className="text-white text-2xl font-semibold tracking-tighter">NC</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">Iniciar Sesión</h1>
            <p className="text-[15px] text-gray-500">Usa tu cuenta NeoCore</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder=" "
                  className="peer w-full px-4 pt-6 pb-2 text-[15px] bg-gray-50/50 border border-gray-200/80 rounded-xl text-gray-900 leading-tight transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <label className="absolute left-4 top-4 text-[13px] text-gray-400 transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-3.5 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-blue-500 font-medium pointer-events-none">
                  Correo electrónico
                </label>
              </div>
            </div>

            <div>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder=" "
                  className="peer w-full px-4 pt-6 pb-2 text-[15px] bg-gray-50/50 border border-gray-200/80 rounded-xl text-gray-900 leading-tight transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 pr-12"
                />
                <label className="absolute left-4 top-4 text-[13px] text-gray-400 transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-3.5 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-blue-500 font-medium pointer-events-none">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 text-right">
              <Link href="/es/forgot-password" className="text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:underline inline-block transition-colors">
                ¿Has olvidado tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl py-6 text-[15px] font-medium transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Iniciando...
                </span>
              ) : (
                'Acceder'
              )}
            </Button>

            <div className="mt-8 text-center pt-6 border-t border-gray-100">
              <p className="text-[13px] text-gray-500">
                ¿Aún no tienes una cuenta Apple... digo, NeoCore?{' '}
                <Link href="/es/register" className="text-[#0071e3] hover:underline font-medium ml-1">
                  Crea una ahora.
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
