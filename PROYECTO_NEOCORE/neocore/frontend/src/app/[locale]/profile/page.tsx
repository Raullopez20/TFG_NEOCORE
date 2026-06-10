'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, bookingsAPI, UserStats, User } from '@/lib/api';
import { User as UserIcon, Mail, Phone, Calendar, Edit2, Save, X, Camera, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    specialty: '',
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) { router.push('/es/login'); return; }
      const [userData, statsData] = await Promise.all([
        authAPI.me(),
        bookingsAPI.myStats().catch(() => null),
      ]);
      setUser(userData);
      setStats(statsData);
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: userData.phone || '',
        specialty: userData.specialty || '',
        bio: userData.bio || '',
      });
    } catch {
      router.push('/es/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await authAPI.updateProfile(formData);
      await loadAll();
      setEditing(false);
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setSaveError(Object.values(data).flat().join(' '));
      } else {
        setSaveError('Error al actualizar el perfil');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({ first_name: user.first_name || '', last_name: user.last_name || '', phone: user.phone || '', bio: user.bio || '', specialty: user.specialty || '' });
    }
    setSaveError('');
    setEditing(false);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('La imagen no puede superar 2 MB'); return; }
    setUploadingPhoto(true);
    try {
      const updated = await authAPI.uploadProfileImage(file);
      setUser(updated);
    } catch (err: any) {
      const msg = err.response?.data?.profile_image?.[0] || err.response?.data?.detail || 'Error al subir la imagen';
      alert(msg);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const roleLabel = (r?: string) => r === 'CLIENT' ? 'Cliente' : r === 'PROFESSIONAL' ? 'Profesional' : 'Administrador';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-64 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=300&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
      </div>

      <div className="container mx-auto px-4">
        {/* Profile Card */}
        <div className="relative -mt-32 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">

              {/* Avatar + upload */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-16 h-16 text-white" />
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {/* Botón cambiar foto */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
                  title="Cambiar foto de perfil"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
                <div className="absolute bottom-9 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{user?.full_name}</h1>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{roleLabel(user?.role)}</span>
                      {user?.specialty && <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">{user.specialty}</span>}
                    </div>
                  </div>
                  {!editing ? (
                    <Button onClick={() => setEditing(true)} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                      <Edit2 className="w-4 h-4" /> Editar Perfil
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                        <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar'}
                      </Button>
                      <Button onClick={handleCancel} className="bg-gray-600 hover:bg-gray-700 flex items-center gap-2">
                        <X className="w-4 h-4" /> Cancelar
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{user?.email}</p></div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div><p className="text-sm text-gray-500">Teléfono</p><p className="font-medium">{user?.phone || 'No especificado'}</p></div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Miembro desde</p>
                      <p className="font-medium">{new Date(user?.created_at || '').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 pb-16">
          {/* Información Personal */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Información Personal</h2>
              {saveError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{saveError}</div>}

              {editing ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                      <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos</label>
                      <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  {(user?.role === 'PROFESSIONAL') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Especialidad</label>
                        <input type="text" value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                          placeholder="Ej: Fisioterapia, Nutrición..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Biografía profesional</label>
                        <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={4}
                          placeholder="Describe tu experiencia, formación y área de especialización..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><p className="text-sm text-gray-500 mb-1">Nombre</p><p className="text-lg font-medium text-gray-900">{user?.first_name}</p></div>
                    <div><p className="text-sm text-gray-500 mb-1">Apellidos</p><p className="text-lg font-medium text-gray-900">{user?.last_name}</p></div>
                  </div>
                  {user?.bio && <div><p className="text-sm text-gray-500 mb-1">Biografía</p><p className="text-gray-700">{user.bio}</p></div>}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats reales */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-md p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Estadísticas</h3>
              {stats ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-200" />
                      <p className="text-blue-200 text-sm">Citas Totales</p>
                    </div>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-300" />
                      <p className="text-blue-200 text-sm">Completadas</p>
                    </div>
                    <p className="text-3xl font-bold">{stats.completed}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-300" />
                      <p className="text-blue-200 text-sm">Próximas</p>
                    </div>
                    <p className="text-3xl font-bold">{stats.upcoming}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-300" />
                      <p className="text-blue-200 text-sm">Canceladas</p>
                    </div>
                    <p className="text-2xl font-bold">{stats.canceled}</p>
                  </div>
                </div>
              ) : (
                <p className="text-blue-200 text-sm">Sin reservas aún</p>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-2">
                <a href="/es/bookings" className="block w-full text-center bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg font-medium transition-colors">
                  Ver mis Reservas
                </a>
                <a href="/es/services" className="block w-full text-center bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 rounded-lg font-medium transition-colors">
                  Explorar Servicios
                </a>
                {user?.role !== 'CLIENT' && (
                  <a href="/es/backoffice" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-colors">
                    Panel de Control
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
