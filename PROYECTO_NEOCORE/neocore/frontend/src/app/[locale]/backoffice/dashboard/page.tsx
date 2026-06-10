'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Loader2,
  ArrowRight,
  UserPlus,
  Wrench,
  Users,
  BookOpen,
  BarChart2,
  Briefcase,
  Code2,
  ExternalLink,
  Copy,
  CheckCheck,
  Database,
  Shield,
  Globe,
} from 'lucide-react';
import { useState as useLocalState } from 'react';
import { adminAPI, BookingStats, Booking, User } from '@/lib/api';

/**
 * Dashboard del backoffice.
 *
 * Muestra a los administradores una vista de 360 grados del estado del
 * sistema:
 *   - Tarjetas de KPIs (usuarios totales, reservas hoy, pendientes, etc.).
 *   - Distribucion de reservas por servicio mediante barras simples.
 *   - Tabla con las ultimas reservas registradas.
 *   - Tabla con los ultimos usuarios registrados.
 *   - Alertas para situaciones que requieren atencion (PENDING > 24h).
 *
 * Todos los datos se obtienen de endpoints reales del backend Django REST
 * mediante adminAPI / bookingsAPI / authAPI. No hay datos mockeados.
 */
export default function BackofficeDashboardPage() {
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Lanzamos las tres peticiones en paralelo para reducir latencia
        const [statsData, bookingsData, usersData] = await Promise.all([
          adminAPI.bookingStats(30),
          adminAPI.listAllBookings({ ordering: '-created_at' }),
          adminAPI.listUsers({ ordering: '-created_at' }),
        ]);
        setStats(statsData);
        setRecentBookings(bookingsData.slice(0, 8));
        setRecentUsers(usersData.slice(0, 6));
      } catch (e: any) {
        console.error('Error cargando dashboard backoffice', e);
        setError(
          e?.response?.data?.detail ||
            'No se han podido cargar las estadisticas. Reintenta mas tarde.'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-blue-500" />
          <p className="text-sm">Cargando estadisticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  // Calculo de KPIs derivados a partir de las listas crudas
  const todayStr = new Date().toDateString();
  const todayBookings = recentBookings.filter(
    (b) => new Date(b.start_datetime).toDateString() === todayStr
  ).length;

  // Reservas pendientes > 24h: requieren confirmacion del profesional
  const yesterday = Date.now() - 24 * 60 * 60 * 1000;
  const pendingOver24h = recentBookings.filter(
    (b) =>
      b.status === 'PENDING' && new Date(b.created_at).getTime() < yesterday
  );

  return (
    <div className="space-y-8">
      {/* Acciones rápidas */}
      <QuickActionsGrid />

      {/* Acceso rápido a la API */}
      <ApiQuickAccess />

      {/* KPIs */}
      <KpiGrid stats={stats!} todayBookings={todayBookings} />

      {/* Alertas */}
      {pendingOver24h.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {pendingOver24h.length}{' '}
              {pendingOver24h.length === 1 ? 'reserva pendiente' : 'reservas pendientes'}{' '}
              de confirmar (mas de 24h)
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Revisa el listado de reservas para acelerar las confirmaciones.
            </p>
          </div>
          <Link
            href="/es/backoffice/bookings?status=PENDING"
            className="text-xs font-medium text-amber-800 hover:underline whitespace-nowrap"
          >
            Ver pendientes &rarr;
          </Link>
        </div>
      )}

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard
          title="Reservas por servicio"
          subtitle="Ultimos 30 dias"
          data={stats?.bookings_by_service || {}}
          color="bg-blue-500"
        />
        <BarChartCard
          title="Reservas por profesional"
          subtitle="Ultimos 30 dias"
          data={stats?.bookings_by_professional || {}}
          color="bg-emerald-500"
        />
      </div>

      {/* Tablas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentBookingsCard bookings={recentBookings} />
        </div>
        <RecentUsersCard users={recentUsers} />
      </div>
    </div>
  );
}

// ============================================================================
// Componente: acciones rápidas del admin
// ============================================================================
function QuickActionsGrid() {
  const actions = [
    { label: 'Nuevo servicio', desc: 'Añadir servicio al catálogo', href: '/es/backoffice/services', icon: Wrench, color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Nuevo profesional', desc: 'Dar de alta un profesional', href: '/es/backoffice/professionals', icon: Briefcase, color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'Gestionar usuarios', desc: 'Roles, altas y bajas', href: '/es/backoffice/users', icon: Users, color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Reservas pendientes', desc: 'Confirmar o rechazar', href: '/es/backoffice/bookings?status=PENDING', icon: CalendarDays, color: 'bg-amber-600 hover:bg-amber-700' },
    { label: 'Todas las reservas', desc: 'Historial completo', href: '/es/backoffice/bookings', icon: BookOpen, color: 'bg-slate-600 hover:bg-slate-700' },
    { label: 'Estadísticas', desc: 'Métricas del sistema', href: '/es/backoffice/stats', icon: BarChart2, color: 'bg-rose-600 hover:bg-rose-700' },
  ];
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-700 mb-3">Acciones rápidas</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`${a.color} rounded-xl p-4 text-white flex flex-col items-start gap-2 transition-colors shadow-sm`}
          >
            <a.icon className="w-6 h-6 opacity-90" />
            <div>
              <p className="text-sm font-semibold leading-tight">{a.label}</p>
              <p className="text-xs opacity-75 mt-0.5 leading-tight">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Acceso rápido a la API (banner compacto en el dashboard)
// ============================================================================
function ApiQuickAccess() {
  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
          <Code2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-white font-semibold">Panel de API — Referencia completa</p>
          <p className="text-slate-400 text-sm">Todos los endpoints, ejemplos curl, prueba integrada y Swagger</p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link href="/es/backoffice/api"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">
          <Code2 className="w-4 h-4" /> Ver API
        </Link>
        <a href="/api/docs/" target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
          <Globe className="w-4 h-4" /> Swagger
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// Panel de referencia de la API con acceso directo (LEGACY — mantener como ref)
// ============================================================================
function ApiReferencePanel() {
  const [copied, setCopied] = useLocalState<string | null>(null);
  const [open, setOpen] = useLocalState(false);

  const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://neocoree.xyz';

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(BASE + url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const groups = [
    {
      title: 'Autenticación', icon: Shield, color: 'text-blue-600',
      endpoints: [
        { method: 'POST', url: '/api/auth/login/', desc: 'Iniciar sesión (devuelve JWT)', tag: 'auth' },
        { method: 'POST', url: '/api/auth/register/', desc: 'Registrar nuevo usuario', tag: 'auth' },
        { method: 'GET',  url: '/api/auth/users/me/', desc: 'Perfil del usuario autenticado', tag: 'auth' },
        { method: 'POST', url: '/api/auth/logout/', desc: 'Cerrar sesión (blacklist refresh)', tag: 'auth' },
        { method: 'POST', url: '/api/token/refresh/', desc: 'Renovar access token', tag: 'auth' },
      ],
    },
    {
      title: 'Usuarios', icon: Users, color: 'text-purple-600',
      endpoints: [
        { method: 'GET',   url: '/api/auth/users/', desc: 'Listar todos los usuarios (admin)', tag: 'admin' },
        { method: 'PATCH', url: '/api/auth/users/{id}/', desc: 'Editar usuario: role, is_active, password', tag: 'admin' },
        { method: 'DELETE',url: '/api/auth/users/{id}/', desc: 'Eliminar usuario (admin)', tag: 'admin' },
        { method: 'GET',   url: '/api/auth/users/professionals/', desc: 'Listar profesionales (público)', tag: 'public' },
      ],
    },
    {
      title: 'Servicios', icon: Sparkles, color: 'text-emerald-600',
      endpoints: [
        { method: 'GET',   url: '/api/services/', desc: 'Listar servicios activos (público)', tag: 'public' },
        { method: 'POST',  url: '/api/services/', desc: 'Crear servicio (admin)', tag: 'admin' },
        { method: 'PATCH', url: '/api/services/{id}/', desc: 'Editar servicio (admin)', tag: 'admin' },
        { method: 'DELETE',url: '/api/services/{id}/', desc: 'Eliminar servicio (admin)', tag: 'admin' },
      ],
    },
    {
      title: 'Reservas', icon: CalendarDays, color: 'text-amber-600',
      endpoints: [
        { method: 'GET',  url: '/api/bookings/', desc: 'Listar reservas (filtradas por rol)', tag: 'auth' },
        { method: 'POST', url: '/api/bookings/', desc: 'Crear reserva (solo clientes)', tag: 'client' },
        { method: 'POST', url: '/api/bookings/{id}/confirm/', desc: 'Confirmar reserva (profesional)', tag: 'prof' },
        { method: 'POST', url: '/api/bookings/{id}/reject/', desc: 'Rechazar reserva (profesional)', tag: 'prof' },
        { method: 'POST', url: '/api/bookings/{id}/cancel/', desc: 'Cancelar reserva', tag: 'auth' },
        { method: 'POST', url: '/api/bookings/{id}/mark_done/', desc: 'Marcar como completada', tag: 'prof' },
        { method: 'GET',  url: '/api/bookings/stats/', desc: 'Estadísticas globales (admin)', tag: 'admin' },
        { method: 'GET',  url: '/api/bookings/my_stats/', desc: 'Estadísticas del usuario actual', tag: 'auth' },
        { method: 'GET',  url: '/api/bookings/upcoming/', desc: 'Próximas reservas del usuario', tag: 'auth' },
      ],
    },
    {
      title: 'Disponibilidad', icon: Clock, color: 'text-rose-600',
      endpoints: [
        { method: 'GET',   url: '/api/availability/rules/', desc: 'Reglas de horario del profesional', tag: 'auth' },
        { method: 'POST',  url: '/api/availability/rules/', desc: 'Crear regla de horario', tag: 'auth' },
        { method: 'DELETE',url: '/api/availability/rules/{id}/', desc: 'Eliminar regla de horario', tag: 'auth' },
        { method: 'GET',   url: '/api/availability/slots/get_slots/', desc: 'Horas disponibles para reservar', tag: 'public' },
      ],
    },
    {
      title: 'Sistema', icon: Database, color: 'text-slate-600',
      endpoints: [
        { method: 'GET',  url: '/api/health/', desc: 'Estado del sistema', tag: 'public' },
        { method: 'GET',  url: '/api/docs/', desc: 'Swagger UI (documentación interactiva)', tag: 'public' },
        { method: 'GET',  url: '/api/schema/', desc: 'Esquema OpenAPI JSON', tag: 'public' },
        { method: 'POST', url: '/api/contact/', desc: 'Formulario de contacto', tag: 'public' },
      ],
    },
  ];

  const tagColor: Record<string, string> = {
    public: 'bg-slate-100 text-slate-600',
    auth:   'bg-blue-100 text-blue-700',
    admin:  'bg-red-100 text-red-700',
    client: 'bg-green-100 text-green-700',
    prof:   'bg-purple-100 text-purple-700',
  };
  const methodColor: Record<string, string> = {
    GET:    'bg-emerald-100 text-emerald-700',
    POST:   'bg-blue-100 text-blue-700',
    PATCH:  'bg-amber-100 text-amber-700',
    DELETE: 'bg-red-100 text-red-700',
    PUT:    'bg-orange-100 text-orange-700',
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Cabecera colapsable */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-800">Panel de API — Referencia de endpoints</p>
            <p className="text-xs text-slate-500">Acceso directo, copiar URLs y abrir en Swagger</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/api/docs/" target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            <Globe className="w-3.5 h-3.5" /> Swagger UI <ExternalLink className="w-3 h-3" />
          </a>
          <ArrowRight className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="border-t">
          {/* Leyenda */}
          <div className="px-6 pt-4 pb-2 flex flex-wrap gap-2 text-xs">
            {Object.entries(tagColor).map(([tag, cls]) => (
              <span key={tag} className={`px-2 py-0.5 rounded-full font-medium ${cls}`}>{tag}</span>
            ))}
            <span className="text-slate-400 ml-2">— niveles de acceso requeridos</span>
          </div>

          <div className="divide-y divide-slate-100">
            {groups.map(group => (
              <div key={group.title} className="px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <group.icon className={`w-4 h-4 ${group.color}`} />
                  <h3 className={`text-sm font-semibold ${group.color}`}>{group.title}</h3>
                </div>
                <div className="space-y-1.5">
                  {group.endpoints.map(ep => (
                    <div key={ep.url + ep.method}
                      className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-slate-50 group transition-colors">
                      <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${methodColor[ep.method] || 'bg-gray-100 text-gray-700'}`}>
                        {ep.method}
                      </span>
                      <code className="flex-1 text-xs text-slate-700 font-mono truncate">{ep.url}</code>
                      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${tagColor[ep.tag]}`}>{ep.tag}</span>
                      <span className="hidden md:block text-xs text-slate-500 truncate max-w-[200px]">{ep.desc}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => copyUrl(ep.url)} title="Copiar URL"
                          className="p-1 rounded hover:bg-slate-200 transition-colors">
                          {copied === ep.url ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                        <a href={`/api/docs/#/${group.title.toLowerCase()}`} target="_blank" rel="noreferrer" title="Abrir en Swagger">
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600 transition-colors m-1" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer del panel */}
          <div className="border-t bg-slate-50 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
            <span>Base URL: <code className="font-mono text-slate-700">{BASE}</code></span>
            <div className="flex gap-3">
              <a href="/api/schema/" target="_blank" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                <Code2 className="w-3 h-3" /> OpenAPI JSON
              </a>
              <a href="/api/docs/" target="_blank" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                <Globe className="w-3 h-3" /> Swagger
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Componente: rejilla de KPIs
// ============================================================================
function KpiGrid({
  stats,
  todayBookings,
}: {
  stats: BookingStats;
  todayBookings: number;
}) {
  const items = [
    {
      label: 'Hoy',
      value: todayBookings,
      icon: CalendarDays,
      color: 'from-blue-500 to-blue-700',
      hint: `${stats.total_bookings} en los ultimos 30 dias`,
    },
    {
      label: 'Pendientes',
      value: stats.pending_bookings,
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
      hint: 'Requieren confirmacion',
    },
    {
      label: 'Confirmadas',
      value: stats.confirmed_bookings,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-emerald-600',
      hint: `${stats.bookings_this_week} esta semana`,
    },
    {
      label: 'Completadas',
      value: stats.completed_bookings,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-700',
      hint: 'Atendidas',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="relative bg-white rounded-2xl border border-slate-200 shadow-sm p-5 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-slate-900">
              {item.value}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">{item.label}</p>
            <p className="text-[11px] text-slate-400 mt-2">{item.hint}</p>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Componente: tarjeta con grafico de barras horizontal hecho a mano
// ============================================================================
function BarChartCard({
  title,
  subtitle,
  data,
  color,
}: {
  title: string;
  subtitle: string;
  data: Record<string, number>;
  color: string;
}) {
  const entries = Object.entries(data)
    .filter(([key]) => key && key.trim() && key !== 'undefined undefined')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Maximo absoluto para normalizar las barras (evita division por cero)
  const max = Math.max(1, ...entries.map(([, v]) => v));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">
            {subtitle}
          </p>
        </div>
        <Sparkles className="w-4 h-4 text-slate-300" />
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">
          Sin datos en el periodo seleccionado.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map(([label, value]) => {
            const percent = Math.round((value / max) * 100);
            return (
              <div key={label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 truncate pr-2">{label}</span>
                  <span className="text-slate-500 font-medium">{value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Componente: tabla con las ultimas reservas
// ============================================================================
function RecentBookingsCard({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Ultimas reservas
          </h3>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">
            Vista rapida
          </p>
        </div>
        <Link
          href="/es/backoffice/bookings"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {bookings.length === 0 ? (
        <p className="text-sm text-slate-400 px-6 py-10 text-center">
          Aun no hay reservas registradas.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50">
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Servicio</th>
                <th className="px-6 py-3">Profesional</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-3 text-slate-700">
                    {b.client_info?.full_name || b.client_info?.email || `#${b.client}`}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {b.service_info?.name || `Servicio #${b.service}`}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {b.professional_info?.full_name || `#${b.professional}`}
                  </td>
                  <td className="px-6 py-3 text-slate-600 whitespace-nowrap">
                    {new Date(b.start_datetime).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                    })}{' '}
                    {new Date(b.start_datetime).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Componente: tarjeta con los ultimos usuarios registrados
// ============================================================================
function RecentUsersCard({ users }: { users: User[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Ultimos usuarios
          </h3>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">
            Altas recientes
          </p>
        </div>
        <Link
          href="/es/backoffice/users"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          Ver todos <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {users.length === 0 ? (
        <p className="text-sm text-slate-400 px-6 py-10 text-center">
          Sin usuarios registrados.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {users.map((u) => (
            <li
              key={u.id}
              className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50/60"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                {(u.first_name || u.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {u.full_name || u.email}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
              </div>
              <RoleBadge role={u.role} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// Helpers visuales
// ============================================================================
function StatusBadge({ status }: { status: Booking['status'] }) {
  const map: Record<Booking['status'], { label: string; cls: string }> = {
    PENDING: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    CONFIRMED: { label: 'Confirmada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REJECTED: { label: 'Rechazada', cls: 'bg-red-50 text-red-700 border-red-200' },
    CANCELED: { label: 'Cancelada', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    DONE: { label: 'Completada', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  };
  const cfg = map[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

function RoleBadge({ role }: { role: User['role'] }) {
  const map = {
    ADMIN: { label: 'Admin', cls: 'bg-purple-100 text-purple-700' },
    PROFESSIONAL: { label: 'Profesional', cls: 'bg-blue-100 text-blue-700' },
    CLIENT: { label: 'Cliente', cls: 'bg-slate-100 text-slate-600' },
  };
  const cfg = map[role];
  return (
    <span
      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}
