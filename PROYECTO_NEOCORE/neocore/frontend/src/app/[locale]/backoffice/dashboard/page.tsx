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

export default function BackofficeDashboardPage() {
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, bookingsData, usersData] = await Promise.all([
          adminAPI.bookingStats(30),
          adminAPI.listAllBookings({ ordering: '-created_at' }),
          adminAPI.listUsers({ ordering: '-created_at' }),
        ]);
        setStats(statsData);
        setRecentBookings(bookingsData.slice(0, 8));
        setRecentUsers(usersData.slice(0, 6));
      } catch (e: any) {
        console.error('Error cargando dashboard', e);
        setError(e?.response?.data?.detail || 'Error al cargar estadísticas.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
          <p className="text-[13px] font-medium uppercase tracking-wide">Cargando métricas</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[18px] border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        <p className="font-medium text-[14px]">{error}</p>
      </div>
    );
  }

  const todayStr = new Date().toDateString();
  const todayBookings = recentBookings.filter(
    (b) => new Date(b.start_datetime).toDateString() === todayStr
  ).length;

  const yesterday = Date.now() - 24 * 60 * 60 * 1000;
  const pendingOver24h = recentBookings.filter(
    (b) => b.status === 'PENDING' && new Date(b.created_at).getTime() < yesterday
  );

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-10">
      {/* KPIs */}
      <KpiGrid stats={stats!} todayBookings={todayBookings} />

      {/* Alertas */}
      {pendingOver24h.length > 0 && (
        <div className="rounded-[20px] border border-amber-200/60 bg-amber-50/80 backdrop-blur-md p-5 flex items-start gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-amber-900 leading-tight">
              {pendingOver24h.length} {pendingOver24h.length === 1 ? 'reserva pendiente' : 'reservas pendientes'} (+24h)
            </p>
            <p className="text-[13px] text-amber-700 mt-1">
              Existen citas esperando confirmación desde hace más de un día.
            </p>
          </div>
          <Link
            href="/es/backoffice/bookings?status=PENDING"
            className="text-[13px] font-medium text-[#0071e3] hover:underline bg-white px-3 py-1.5 rounded-full shadow-sm"
          >
            Revisar
          </Link>
        </div>
      )}

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard
          title="Servicios Demandados"
          subtitle="Últimos 30 días"
          data={stats?.bookings_by_service || {}}
          color="bg-[#0071e3]"
        />
        <BarChartCard
          title="Rendimiento Profesionales"
          subtitle="Últimos 30 días"
          data={stats?.bookings_by_professional || {}}
          color="bg-[#34C759]"
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

function KpiGrid({ stats, todayBookings }: { stats: BookingStats; todayBookings: number }) {
  const items = [
    { label: 'Citas Hoy', value: todayBookings, icon: CalendarDays, color: 'from-[#0071e3] to-[#005bb5]', hint: `${stats.total_bookings} este mes` },
    { label: 'Pendientes', value: stats.pending_bookings, icon: Clock, color: 'from-[#F59E0B] to-[#D97706]', hint: 'Esperando acción' },
    { label: 'Confirmadas', value: stats.confirmed_bookings, icon: CheckCircle2, color: 'from-[#34C759] to-[#30B753]', hint: 'Esta semana' },
    { label: 'Ingresos / Finalizadas', value: stats.completed_bookings, icon: TrendingUp, color: 'from-[#5E5CE6] to-[#5856D6]', hint: 'Atendidas' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="relative bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 overflow-hidden transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-sm`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[34px] font-bold text-gray-900 tracking-tight leading-none mb-1">
              {item.value}
            </p>
            <p className="text-[13px] font-medium text-gray-500">{item.label}</p>
            <p className="text-[11px] font-medium text-gray-400 mt-3 pt-3 border-t border-gray-100">{item.hint}</p>
          </div>
        );
      })}
    </div>
  );
}

function BarChartCard({ title, subtitle, data, color }: { title: string; subtitle: string; data: Record<string, number>; color: string }) {
  const entries = Object.entries(data).filter(([key]) => key && key.trim() && key !== 'undefined undefined').sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = Math.max(1, ...entries.map(([, v]) => v));

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[18px] font-semibold text-gray-900 tracking-tight">{title}</h3>
          <p className="text-[12px] font-medium text-gray-400 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
           <Sparkles className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="text-[13px] text-gray-400 py-10 text-center font-medium">No hay datos suficientes.</p>
      ) : (
        <div className="space-y-4 pt-2">
          {entries.map(([label, value]) => {
            const percent = Math.round((value / max) * 100);
            return (
              <div key={label} className="group">
                <div className="flex items-center justify-between text-[13px] mb-2 font-medium">
                  <span className="text-gray-700 truncate pr-2">{label}</span>
                  <span className="text-gray-900">{value}</span>
                </div>
                <div className="h-[6px] rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecentBookingsCard({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      <div className="flex items-center justify-between px-7 py-6 border-b border-gray-100/60">
        <div>
          <h3 className="text-[18px] font-semibold text-gray-900 tracking-tight">Citas Recientes</h3>
          <p className="text-[12px] font-medium text-gray-400 uppercase tracking-widest mt-1">Actividad en tiempo real</p>
        </div>
        <Link href="/es/backoffice/bookings" className="text-[13px] font-medium text-[#0071e3] hover:underline flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full">
          Gestionar <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {bookings.length === 0 ? (
        <p className="text-[13px] text-gray-400 px-7 py-12 text-center font-medium">Ninguna reserva activa.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/50">
                <th className="px-7 py-4 font-semibold">Cliente</th>
                <th className="px-7 py-4 font-semibold">Servicio</th>
                <th className="px-7 py-4 font-semibold">Fecha</th>
                <th className="px-7 py-4 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/60">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-7 py-4">
                    <p className="font-medium text-gray-900">{b.client_info?.full_name || `#${b.client}`}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{b.client_info?.email}</p>
                  </td>
                  <td className="px-7 py-4 text-gray-700">
                    <p className="font-medium">{b.service_info?.name || `Servicio #${b.service}`}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{b.professional_info?.full_name}</p>
                  </td>
                  <td className="px-7 py-4 text-gray-600 whitespace-nowrap font-medium">
                    {new Date(b.start_datetime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}{' '}
                    <span className="text-gray-400">|</span> {new Date(b.start_datetime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-7 py-4">
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

function RecentUsersCard({ users }: { users: User[] }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-7 py-6 border-b border-gray-100/60">
        <div>
          <h3 className="text-[18px] font-semibold text-gray-900 tracking-tight">Nuevos Usuarios</h3>
          <p className="text-[12px] font-medium text-gray-400 uppercase tracking-widest mt-1">Registros</p>
        </div>
        <Link href="/es/backoffice/users" className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ArrowRight className="w-4 h-4 text-gray-500" />
        </Link>
      </div>
      {users.length === 0 ? (
        <p className="text-[13px] text-gray-400 px-7 py-12 text-center font-medium">Sin nuevos usuarios.</p>
      ) : (
        <ul className="divide-y divide-gray-100/60 flex-1">
          {users.map((u) => (
            <li key={u.id} className="px-7 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200/50 text-gray-600 flex items-center justify-center text-[13px] font-bold shadow-sm">
                {(u.first_name || u.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-gray-900 truncate">{u.full_name || u.email}</p>
                <p className="text-[12px] text-gray-400 truncate mt-0.5">{u.email}</p>
              </div>
              <RoleBadge role={u.role} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Booking['status'] }) {
  const map: Record<Booking['status'], { label: string; bg: string; text: string }> = {
    PENDING: { label: 'Pendiente', bg: 'bg-[#F59E0B]/15', text: 'text-[#D97706]' },
    CONFIRMED: { label: 'Confirmada', bg: 'bg-[#34C759]/15', text: 'text-[#30B753]' },
    REJECTED: { label: 'Rechazada', bg: 'bg-[#FF3B30]/15', text: 'text-[#FF3B30]' },
    CANCELED: { label: 'Cancelada', bg: 'bg-gray-100', text: 'text-gray-500' },
    DONE: { label: 'Completada', bg: 'bg-[#0071e3]/15', text: 'text-[#0071e3]' },
  };
  const cfg = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function RoleBadge({ role }: { role: User['role'] }) {
  const map = {
    ADMIN: { label: 'Admin', cls: 'bg-purple-100 text-purple-700' },
    PROFESSIONAL: { label: 'Especialista', cls: 'bg-blue-100 text-[#0071e3]' },
    CLIENT: { label: 'Cliente', cls: 'bg-gray-100 text-gray-600' },
  };
  const cfg = map[role] || map.CLIENT;
  return (
    <span className={`text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
