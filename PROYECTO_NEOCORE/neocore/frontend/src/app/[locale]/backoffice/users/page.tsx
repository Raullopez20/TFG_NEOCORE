'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Loader2,
  Trash2,
  ShieldCheck,
  UserCog,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react';
import { adminAPI, User } from '@/lib/api';

export default function BackofficeUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'' | User['role']>('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminAPI.listUsers({
          role: roleFilter || undefined,
          is_active: activeFilter === '' ? undefined : activeFilter === 'true' ? true : false,
          search: debouncedSearch || undefined,
          ordering: '-created_at',
        });
        setUsers(data);
      } catch (e: any) {
        console.error('Error cargando usuarios', e);
        setError(e?.response?.data?.detail || 'No se han podido cargar los usuarios.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [debouncedSearch, roleFilter, activeFilter]);

  const counts = useMemo(() => {
    return {
      total: users.length,
      clients: users.filter((u) => u.role === 'CLIENT').length,
      professionals: users.filter((u) => u.role === 'PROFESSIONAL').length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
    };
  }, [users]);

  const handleRoleChange = async (id: number, newRole: User['role']) => {
    setBusyId(id);
    try {
      const updated = await adminAPI.updateUser(id, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    } catch (e) {
      console.error('Error cambiando rol', e);
      alert('No se ha podido actualizar el rol del usuario.');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (user: User) => {
    setBusyId(user.id);
    try {
      const updated = await adminAPI.updateUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
    } catch (e) {
      console.error('Error cambiando estado activo', e);
      alert('No se ha podido actualizar el estado del usuario.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${user.email}? Esta acción no se puede deshacer.`)) {
      return;
    }
    setBusyId(user.id);
    try {
      await adminAPI.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (e) {
      console.error('Error eliminando usuario', e);
      alert('No se ha podido eliminar el usuario.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total" value={counts.total} icon={UsersIcon} color="from-gray-800 to-gray-900" />
        <SummaryCard label="Clientes" value={counts.clients} icon={UsersIcon} color="from-[#0071e3] to-[#005bb5]" />
        <SummaryCard label="Profesionales" value={counts.professionals} icon={UserCog} color="from-[#34C759] to-[#30B753]" />
        <SummaryCard label="Administradores" value={counts.admins} icon={ShieldCheck} color="from-[#5E5CE6] to-[#5856D6]" />
      </div>

      {/* Filtros */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-11 pr-4 py-2.5 text-[14px] bg-gray-50/50 rounded-xl border border-gray-200/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all font-medium text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-50/50 border border-gray-200/60 rounded-xl px-3 py-1">
            <Filter className="w-4 h-4 text-gray-400 mr-2" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="text-[13px] font-medium bg-transparent border-none py-1.5 pr-6 focus:outline-none focus:ring-0 text-gray-700 cursor-pointer"
            >
              <option value="">Todos los roles</option>
              <option value="CLIENT">Clientes</option>
              <option value="PROFESSIONAL">Profesionales</option>
              <option value="ADMIN">Administradores</option>
            </select>
          </div>
          <div className="flex items-center bg-gray-50/50 border border-gray-200/60 rounded-xl px-3 py-1">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
              className="text-[13px] font-medium bg-transparent border-none py-1.5 pr-6 focus:outline-none focus:ring-0 text-gray-700 cursor-pointer"
            >
              <option value="">Cualquier estado</option>
              <option value="true">Solo activos</option>
              <option value="false">Solo inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#0071e3]" />
            <p className="text-[13px] font-medium uppercase tracking-wide">Cargando base de datos</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-[14px] font-medium text-red-600">{error}</div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-[14px] font-medium">
            No se encontraron usuarios que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[14px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/50">
                  <th className="px-7 py-4 font-semibold">Usuario</th>
                  <th className="px-7 py-4 font-semibold">Email</th>
                  <th className="px-7 py-4 font-semibold">Rol</th>
                  <th className="px-7 py-4 font-semibold">Estado</th>
                  <th className="px-7 py-4 font-semibold">Registro</th>
                  <th className="px-7 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200/50 text-gray-700 flex items-center justify-center text-[13px] font-bold shadow-sm">
                          {(u.first_name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 tracking-tight">
                            {u.full_name || '(sin nombre)'}
                          </p>
                          {u.phone && (
                            <p className="text-[12px] text-gray-500 font-medium mt-0.5">{u.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-7 py-4 text-gray-600 font-medium">{u.email}</td>
                    <td className="px-7 py-4">
                      <select
                        value={u.role}
                        disabled={busyId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as User['role'])}
                        className="text-[12px] font-semibold bg-gray-50/50 rounded-[10px] border border-gray-200/60 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 disabled:opacity-50 cursor-pointer"
                      >
                        <option value="CLIENT">Cliente</option>
                        <option value="PROFESSIONAL">Profesional</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-7 py-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-[#34C759]/15 text-[#30B753]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500">
                          <XCircle className="w-3.5 h-3.5" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-7 py-4 text-gray-500 text-[13px] font-medium whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-7 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={busyId === u.id}
                          className="text-[12px] font-semibold px-3 py-1.5 rounded-[10px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-all"
                        >
                          {u.is_active ? 'Suspender' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={busyId === u.id}
                          className="p-1.5 rounded-[10px] text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                          title="Eliminar registro"
                        >
                          {busyId === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string; }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-500">{label}</p>
          <p className="text-[32px] font-bold text-gray-900 mt-1 leading-none tracking-tight">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-sm`}>
          <Icon className="w-[22px] h-[22px]" />
        </div>
      </div>
    </div>
  );
}
