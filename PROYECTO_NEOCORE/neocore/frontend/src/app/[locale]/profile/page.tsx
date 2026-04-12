'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, User } from '@/lib/api';
import { User as UserIcon, Mail, Phone, Calendar, Edit2, Save, X, CalendarCheck, Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/es/login');
        return;
      }

      const userData = await authAPI.me();
      setUser(userData);
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      router.push('/es/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await authAPI.updateProfile(formData);
      await loadProfile();
      setEditing(false);
      toast.success('Perfil actualizado');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar');
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        bio: user.bio || '',
      });
    }
    setEditing(false);
  };

  const getInitials = () => {
    if (!user) return '';
    const first = user.first_name?.charAt(0) || '';
    const last = user.last_name?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  const getRoleLabel = () => {
    if (!user) return '';
    switch (user.role) {
      case 'CLIENT': return 'Cliente';
      case 'PROFESSIONAL': return 'Profesional';
      case 'ADMIN': return 'Administrador';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Cover / Hero */}
      <div className="bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-950 h-48" />

      <div className="container mx-auto px-4">
        {/* Profile Card */}
        <div className="-mt-24 relative mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-4 ring-white shadow-lg overflow-hidden">
                  {user?.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white select-none">
                      {getInitials()}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-white" />
              </div>

              {/* Info + Actions */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {user?.full_name}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold tracking-wide uppercase">
                        {getRoleLabel()}
                      </span>
                      {user?.specialty && (
                        <span className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold tracking-wide">
                          {user.specialty}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {!editing ? (
                      <Button
                        onClick={() => setEditing(true)}
                        className="bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2 rounded-xl px-5"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar Perfil
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSave}
                          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-xl px-5"
                        >
                          <Save className="w-4 h-4" />
                          Guardar
                        </Button>
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          className="flex items-center gap-2 rounded-xl px-5 border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <X className="w-4 h-4" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Telefono</p>
                      <p className="text-sm font-semibold text-gray-900">{user?.phone || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Miembro desde</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(user?.created_at || '').toLocaleDateString('es-ES', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-8 pb-16">
          {/* Personal Information */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Informacion Personal</h2>

              <AnimatePresence mode="wait">
                {editing ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={formData.first_name}
                          onChange={(e) =>
                            setFormData({ ...formData, first_name: e.target.value })
                          }
                          className="input-premium w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Apellidos
                        </label>
                        <input
                          type="text"
                          value={formData.last_name}
                          onChange={(e) =>
                            setFormData({ ...formData, last_name: e.target.value })
                          }
                          className="input-premium w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefono
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="input-premium w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      />
                    </div>

                    {user?.role === 'PROFESSIONAL' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Biografia
                        </label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={4}
                          className="input-premium w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                        />
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Nombre</p>
                        <p className="text-base font-semibold text-gray-900">{user?.first_name}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Apellidos</p>
                        <p className="text-base font-semibold text-gray-900">{user?.last_name}</p>
                      </div>
                    </div>

                    {user?.bio && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Biografia</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{user.bio}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Side Panel - Acciones Rapidas */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones Rapidas</h3>
              <div className="space-y-3">
                <a
                  href="/es/bookings"
                  className="group flex items-center gap-3 w-full p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <CalendarCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Ver Reservas</p>
                    <p className="text-xs text-gray-500">Gestiona tus citas</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </a>

                <a
                  href="/es/services"
                  className="group flex items-center gap-3 w-full p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Servicios</p>
                    <p className="text-xs text-gray-500">Explora el catalogo</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
