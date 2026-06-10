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

/**
 * Pagina de gestion de usuarios del backoffice.
 *
 * Funcionalidades:
 *   - Listado paginado de todos los usuarios del sistema.
 *   - Filtros por rol (CLIENT/PROFESSIONAL/ADMIN) y por estado activo.
 *   - Buscador por nombre o email (debounced).
 *   - Acciones rapidas: cambiar rol, activar/desactivar y eliminar.
 *   - Ordenacion por defecto: ultimos registrados primero.
 *
 * Todas las operaciones requieren rol ADMIN; el AdminGuard del layout
 * ya bloquea el acceso a usuarios sin privilegios suficientes.
 */
export default function BackofficeUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'' | User['role']>('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
  const [busyId, setBusyId] = useState<number | null>(null);

  // Debounce para evitar recargar la lista en cada tecla
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Carga inicial + recargas cuando cambian los filtros
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminAPI.listUsers({
          role: roleFilter || undefined,
          is_active:
            activeFilter === ''
              ? undefined
              : activeFilter === 'true'
              ? true
              : false,
          search: debouncedSearch || undefined,
          ordering: '-created_at',
        });
        setUsers(data);
      } catch (e: any) {
        console.error('Error cargando usuarios', e);
        setError(
          e?.response?.data?.detail || 'No se han podido cargar los usuarios.'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [debouncedSearch, roleFilter, activeFilter]);

  // Conteo agregado para las tarjetas superiores
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
      const updated = await adminAPI.updateUser(user.id, {
        is_active: !user.is_active,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u))
      );
    } catch (e) {
      console.error('Error cambiando estado activo', e);
      alert('No se ha podido actualizar el estado del usuario.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user: User) => {
    if (
      !confirm(
        `Estas seguro de eliminar al usuario ${user.email}? Esta accion no se puede deshacer.`
      )
    ) {
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
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total" value={counts.total} icon={UsersIcon} color="from-slate-500 to-slate-700" />
        <SummaryCard label="Clientes" value={counts.clients} icon={UsersIcon} color="from-blue-500 to-blue-700" />
        <SummaryCard label="Profesionales" value={counts.professionals} icon={UserCog} color="from-emerald-500 to-emerald-700" />
        <SummaryCard label="Administradores" value={counts.admins} icon={ShieldCheck} color="from-purple-500 to-purple-700" />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Todos los roles</option>
            <option value="CLIENT">Clientes</option>
            <option value="PROFESSIONAL">Profesionales</option>
            <option value="ADMIN">Administradores</option>
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Activos e inactivos</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            Cargando usuarios...
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-600">{error}</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            No se encontraron usuarios con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50">
                  <th className="px-6 py-3">Usuario</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Rol</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Alta</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                          {(u.first_name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {u.full_name || '(sin nombre)'}
                          </p>
                          {u.phone && (
                            <p className="text-[11px] text-slate-400">{u.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{u.email}</td>
                    <td className="px-6 py-3">
                      <select
                        value={u.role}
                        disabled={busyId === u.id}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value as User['role'])
                        }
                        className="text-xs rounded-md border border-slate-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                      >
                        <option value="CLIENT">Cliente</option>
                        <option value="PROFESSIONAL">Profesional</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <XCircle className="w-3.5 h-3.5" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={busyId === u.id}
                          className="text-xs px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {u.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={busyId === u.id}
                          className="text-xs p-1.5 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Eliminar usuario"
                        >
                          {busyId === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
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

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-900 mt-0.5">{value}</p>
        </div>
        <div
          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} text-white flex items-center justify-center`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
