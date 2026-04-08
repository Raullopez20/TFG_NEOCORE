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
} from 'lucide-react';
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
