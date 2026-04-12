'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password1: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const passwordStrength = useMemo(() => {
    const len = formData.password1.length;
    if (len === 0) return { level: 0, color: 'bg-gray-200', label: '' };
    if (len < 6) return { level: 1, color: 'bg-red-500', label: 'Débil' };
    if (len < 10) return { level: 2, color: 'bg-yellow-500', label: 'Media' };
    return { level: 3, color: 'bg-green-500', label: 'Fuerte' };
  }, [formData.password1]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password1 !== formData.password2) {
      toast.error('Las contraseñas no coinciden', {
        description: 'Asegúrate de que ambas contraseñas sean idénticas.',
      });
      setLoading(false);
      return;
    }

    try {
      await authAPI.register(formData);
      router.push('/es/login?registered=true');
    } catch (err: any) {
      const data = err.response?.data;
      let errorMsg = 'Error al registrar usuario';
      if (typeof data === 'string') {
        errorMsg = data;
      } else if (data?.detail) {
        errorMsg = Array.isArray(data.detail) ? data.detail.join(' ') : data.detail;
      } else if (data?.message) {
        errorMsg = data.message;
      } else if (data && typeof data === 'object') {
        const parts = Object.entries(data).map(([k, v]) => {
          const msg = Array.isArray(v) ? v.join(' ') : String(v);
          return msg ? `${k}: ${msg}` : '';
        }).filter(Boolean);
        if (parts.length) errorMsg = parts.join('. ');
      } else {
        errorMsg = err.message || errorMsg;
      }
      toast.error('Error de registro', { description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#f5f5f7] py-12">
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

      <div className="relative z-10 w-full max-w-[440px] px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/80 backdrop-blur-2xl px-8 sm:px-10 py-10 rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white/40"
        >
          {/* Back Nav */}
          <Link
            href="/es"
            className="group flex items-center text-[13px] font-medium text-gray-400 hover:text-gray-800 transition-colors mb-6 -ml-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
            Volver
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">Crear tu cuenta</h1>
            <p className="text-[14px] text-gray-500">Un ID de NeoCore es todo lo que necesitas.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative group">
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder=" "
                  className="peer w-full px-3.5 pt-6 pb-2 text-[15px] bg-gray-50/50 border border-gray-200/80 rounded-xl text-gray-900 leading-tight transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <label className="absolute left-3.5 top-4 text-[13px] text-gray-400 transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-3.5 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-blue-500 font-medium pointer-events-none">
                  Nombre
                </label>
              </div>
              <div className="relative group">
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  placeholder=" "
                  className="peer w-full px-3.5 pt-6 pb-2 text-[15px] bg-gray-50/50 border border-gray-200/80 rounded-xl text-gray-900 leading-tight transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <label className="absolute left-3.5 top-4 text-[13px] text-gray-400 transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-3.5 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-blue-500 font-medium pointer-events-none">
                  Apellidos
                </label>
              </div>
            </div>

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

            <div className="relative group">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder=" "
                className="peer w-full px-4 pt-6 pb-2 text-[15px] bg-gray-50/50 border border-gray-200/80 rounded-xl text-gray-900 leading-tight transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              <label className="absolute left-4 top-4 text-[13px] text-gray-400 transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-3.5 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-blue-500 font-medium pointer-events-none">
                Teléfono <span className="text-gray-300 font-normal">(opcional)</span>
              </label>
            </div>

            <div className="relative group">
              <input
                type={showPassword1 ? 'text' : 'password'}
                name="password1"
                value={formData.password1}
                onChange={handleChange}
                required
                minLength={8}
                placeholder=" "
                className="peer w-full px-4 pt-6 pb-2 text-[15px] bg-gray-50/50 border border-gray-200/80 rounded-xl text-gray-900 leading-tight transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 pr-12"
              />
              <label className="absolute left-4 top-4 text-[13px] text-gray-400 transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-3.5 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-blue-500 font-medium pointer-events-none">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPassword1(!showPassword1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showPassword1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {formData.password1.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <div className="flex-1 h-[3px] bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.level / 3) * 100}%` }}
                  />
                </div>
                <span className={`text-[11px] font-medium ${
                  passwordStrength.level === 1 ? 'text-red-500' :
                  passwordStrength.level === 2 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>
            )}

            <div className="relative group">
              <input
                type={showPassword2 ? 'text' : 'password'}
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                required
                minLength={8}
                placeholder=" "
                className="peer w-full px-4 pt-6 pb-2 text-[15px] bg-gray-50/50 border border-gray-200/80 rounded-xl text-gray-900 leading-tight transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 pr-12"
              />
              <label className="absolute left-4 top-4 text-[13px] text-gray-400 transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-3.5 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-blue-500 font-medium pointer-events-none">
                Confirmar contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPassword2(!showPassword2)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl py-6 text-[15px] font-medium transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creando...
                </span>
              ) : (
                'Crear cuenta'
              )}
            </Button>

            <div className="mt-8 text-center pt-6 border-t border-gray-100">
              <p className="text-[13px] text-gray-500">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/es/login" className="text-[#0071e3] hover:underline font-medium ml-1">
                  Inicia sesión aquí.
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
