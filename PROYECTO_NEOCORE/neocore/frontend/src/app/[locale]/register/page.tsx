'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  Shield,
  Clock,
  Star,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const passwordStrength = useMemo(() => {
    const len = formData.password1.length;
    if (len === 0) return { level: 0, color: 'bg-gray-200', label: '' };
    if (len < 6) return { level: 1, color: 'bg-red-500', label: 'Debil' };
    if (len < 10) return { level: 2, color: 'bg-yellow-500', label: 'Media' };
    return { level: 3, color: 'bg-green-500', label: 'Fuerte' };
  }, [formData.password1]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password1 !== formData.password2) {
      setError('Las contrasenas no coinciden');
      setLoading(false);
      return;
    }

    try {
      await authAPI.register(formData);
      router.push('/es/login?registered=true');
    } catch (err: any) {
      const data = err.response?.data;
      if (typeof data === 'string') {
        setError(data);
      } else if (data?.detail) {
        setError(Array.isArray(data.detail) ? data.detail.join(' ') : data.detail);
      } else if (data?.message) {
        setError(data.message);
      } else if (data && typeof data === 'object') {
        const parts = Object.entries(data).map(([k, v]) => {
          const msg = Array.isArray(v) ? v.join(' ') : String(v);
          return msg ? `${k}: ${msg}` : '';
        }).filter(Boolean);
        setError(parts.length ? parts.join('. ') : 'Error al registrar usuario');
      } else {
        setError(err.message || 'Error al registrar usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const benefits = [
    {
      icon: Shield,
      title: 'Seguridad garantizada',
      description: 'Tus datos protegidos con la mejor tecnologia',
    },
    {
      icon: Clock,
      title: 'Reserva en segundos',
      description: 'Proceso rapido y sin complicaciones',
    },
    {
      icon: Star,
      title: 'Calidad premium',
      description: 'Los mejores profesionales a tu disposicion',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-950 flex-col items-center justify-center p-12">
        {/* Floating orbs */}
        <div className="absolute top-20 left-16 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl" />

        <div className="relative z-10 max-w-md text-center">
          {/* Branding */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">
              Neo<span className="text-blue-400">Core</span>
            </h2>
            <div className="w-12 h-1 bg-blue-500 rounded-full mx-auto" />
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl font-semibold text-white mb-10"
          >
            Unete a NeoCore
          </motion.h3>

          {/* Benefits */}
          <div className="space-y-6">
            {benefits.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.15 }}
                className="flex items-start gap-4 text-left"
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <item.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{item.title}</p>
                  <p className="text-blue-200/70 text-sm mt-0.5">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col bg-white overflow-y-auto">
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md">
            {/* Back link */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link
                href="/es"
                className="inline-flex items-center text-gray-500 hover:text-gray-800 text-sm mb-8 group transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Volver al inicio
              </Link>
            </motion.div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear cuenta</h1>
              <p className="text-gray-500">Completa tus datos para empezar</p>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-600 p-4 text-sm flex items-start gap-3 overflow-hidden"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-5"
              >
                {/* First name / Last name */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nombre
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        className="input-premium pl-10"
                        placeholder="Juan"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Apellido
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        className="input-premium pl-10"
                        placeholder="Perez"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Email */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Correo electronico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="input-premium pl-10"
                      placeholder="tu@email.com"
                    />
                  </div>
                </motion.div>

                {/* Phone */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Telefono <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-premium pl-10"
                      placeholder="+34 123 456 789"
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Contrasena
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword1 ? 'text' : 'password'}
                      name="password1"
                      value={formData.password1}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="input-premium pl-10 pr-11"
                      placeholder="--------"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword1(!showPassword1)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {formData.password1.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.level / 3) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.level === 1 ? 'text-red-500' :
                        passwordStrength.level === 2 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Confirm Password */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirmar contrasena
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword2 ? 'text' : 'password'}
                      name="password2"
                      value={formData.password2}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="input-premium pl-10 pr-11"
                      placeholder="--------"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword2(!showPassword2)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>

                {/* Submit */}
                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full gradient-primary rounded-xl py-3 font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Registrando...
                      </span>
                    ) : (
                      'Crear cuenta'
                    )}
                  </Button>
                </motion.div>

                {/* Footer */}
                <motion.div variants={itemVariants} className="text-center pt-2">
                  <p className="text-sm text-gray-500">
                    Ya tienes una cuenta?{' '}
                    <Link
                      href="/es/login"
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Inicia sesion
                    </Link>
                  </p>
                </motion.div>
              </motion.div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
