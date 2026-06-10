'use client';

import { useEffect, useState } from 'react';
import { adminAPI, BookingStats } from '@/lib/api';
import { Loader2, TrendingUp, CheckCircle2, XCircle, Clock, CalendarDays, Users, BarChart2 } from 'lucide-react';

const PERIODS = [
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
  { label: '1 año', days: 365 },
];

export default function BackofficeStatsPage() {
  const [period, setPeriod] = useState(30);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminAPI.bookingStats(period)
      .then(setStats)
      .catch(e => setError(e?.response?.data?.detail || 'No se pudieron cargar las estadísticas.'))
      .finally(() => setLoading(false));
  }, [period]);

  const total = stats?.total_bookings ?? 0;
  const completed = stats?.completed_bookings ?? 0;
  const pending = stats?.pending_bookings ?? 0;
  const confirmed = stats?.confirmed_bookings ?? 0;
  const canceled = stats?.canceled_bookings ?? 0;
  const rejected = stats?.rejected_bookings ?? 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const cancellationRate = total > 0 ? Math.round(((canceled + rejected) / total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Cabecera + selector de período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Estadísticas del sistema</h1>
          <p className="text-sm text-slate-500 mt-0.5">Métricas de reservas, servicios y profesionales</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {PERIODS.map(p => (
            <button key={p.days} onClick={() => setPeriod(p.days)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p.days ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">{error}</div>}

      {!loading && !error && stats && (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total reservas" value={total} icon={CalendarDays} color="bg-blue-600" />
            <KpiCard label="Esta semana" value={stats.bookings_this_week} icon={TrendingUp} color="bg-emerald-600" />
            <KpiCard label="Tasa de completadas" value={`${completionRate}%`} icon={CheckCircle2} color="bg-purple-600" />
            <KpiCard label="Tasa de cancelación" value={`${cancellationRate}%`} icon={XCircle} color="bg-rose-600" />
          </div>

          {/* Desglose por estado */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" /> Reservas por estado — últimos {period} días
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatusBar label="Pendientes" value={pending} total={total} color="bg-amber-400" />
              <StatusBar label="Confirmadas" value={confirmed} total={total} color="bg-blue-400" />
              <StatusBar label="Completadas" value={completed} total={total} color="bg-emerald-400" />
              <StatusBar label="Canceladas" value={canceled} total={total} color="bg-slate-400" />
              <StatusBar label="Rechazadas" value={rejected} total={total} color="bg-rose-400" />
            </div>
          </div>

          {/* Por servicio y por profesional */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RankingCard
              title="Reservas por servicio"
              icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
              data={stats.bookings_by_service}
              color="bg-blue-500"
            />
            <RankingCard
              title="Reservas por profesional"
              icon={<Users className="w-4 h-4 text-emerald-600" />}
              data={stats.bookings_by_professional}
              color="bg-emerald-500"
            />
          </div>

          {/* Resumen temporal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SummaryCard label="Reservas esta semana" value={stats.bookings_this_week} subtitle="Últimos 7 días" />
            <SummaryCard label="Reservas este mes" value={stats.bookings_this_month} subtitle="Últimos 30 días" />
          </div>
        </>
      )}
    </div>
  );
}

// ── Componentes ──────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4">
      <div className={`${color} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs font-bold text-slate-800">{value}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400 mt-1">{pct}%</p>
    </div>
  );
}

function RankingCard({ title, icon, data, color }: { title: string; icon: React.ReactNode; data: Record<string, number>; color: string }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = sorted[0]?.[1] ?? 1;
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">{icon} {title}</h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">Sin datos en este período</p>
      ) : (
        <div className="space-y-3">
          {sorted.map(([name, count]) => (
            <div key={name}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-700 truncate max-w-[70%]">{name}</span>
                <span className="text-sm font-bold text-slate-800">{count}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`${color} h-full rounded-full`} style={{ width: `${(count / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, subtitle }: { label: string; value: number; subtitle: string }) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white">
      <p className="text-blue-200 text-sm mb-1">{subtitle}</p>
      <p className="text-4xl font-bold">{value}</p>
      <p className="text-blue-100 text-sm mt-1">{label}</p>
    </div>
  );
}
