'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Loader2,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { adminAPI, bookingsAPI, Booking } from '@/lib/api';

const STATUS_OPTIONS: { value: '' | Booking['status']; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'DONE', label: 'Completadas' },
  { value: 'REJECTED', label: 'Rechazadas' },
  { value: 'CANCELED', label: 'Canceladas' },
];

/**
 * Pagina de gestion de reservas del backoffice.
 *
 * Permite al administrador:
 *   - Listar TODAS las reservas del sistema (no solo las propias).
 *   - Filtrar por estado y buscar por nombre de cliente, profesional o servicio.
 *   - Cancelar cualquier reserva activa.
 *   - Ver el detalle completo de una reserva.
 *
 * Las acciones de cambio de estado mas finas (confirmar/rechazar/marcar
 * como hecha) se reservan al profesional dueno de la reserva, segun la
 * logica del backend; el admin solo puede cancelar (override de seguridad).
 */
export default function BackofficeBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | Booking['status']>('');
  const [busyId, setBusyId] = useState<number | null>(null);

  // Permitir entrar a la pagina con ?status=PENDING desde alertas
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status && STATUS_OPTIONS.some((s) => s.value === status)) {
      setStatusFilter(status as Booking['status']);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminAPI.listAllBookings({
          status: statusFilter || undefined,
          search: debouncedSearch || undefined,
          ordering: '-start_datetime',
        });
        setBookings(data);
      } catch (e: any) {
        console.error('Error cargando reservas', e);
        setError(
          e?.response?.data?.detail || 'No se han podido cargar las reservas.'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [statusFilter, debouncedSearch]);

  const counts = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === 'PENDING').length,
      confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
      done: bookings.filter((b) => b.status === 'DONE').length,
    };
  }, [bookings]);

  const handleCancel = async (b: Booking) => {
    const reason = prompt(
      'Motivo de la cancelacion (opcional):',
      'Cancelado por administracion'
    );
    if (reason === null) return; // el admin cancelo el dialogo
    setBusyId(b.id);
    try {
      const updated = await bookingsAPI.cancel(b.id, reason || undefined);
      setBookings((prev) =>
        prev.map((x) => (x.id === b.id ? { ...x, ...updated } : x))
      );
    } catch (e) {
      console.error('Error cancelando reserva', e);
      alert('No se ha podido cancelar la reserva.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Summary label="Total" value={counts.total} color="from-slate-500 to-slate-700" />
        <Summary label="Pendientes" value={counts.pending} color="from-amber-500 to-amber-600" />
        <Summary label="Confirmadas" value={counts.confirmed} color="from-emerald-500 to-emerald-600" />
        <Summary label="Completadas" value={counts.done} color="from-blue-500 to-blue-700" />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, profesional o servicio..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            Cargando reservas...
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-600">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            No se encontraron reservas con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50">
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Profesional</th>
                  <th className="px-6 py-3">Servicio</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-3 text-slate-700 whitespace-nowrap">
                      <div className="font-medium">
                        {new Date(b.start_datetime).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(b.start_datetime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(b.end_datetime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {b.client_info?.full_name || b.client_info?.email || `#${b.client}`}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {b.professional_info?.full_name || `#${b.professional}`}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {b.service_info?.name || `#${b.service}`}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/es/bookings/${b.id}`}
                          className="text-xs px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </Link>
                        {b.status === 'PENDING' || b.status === 'CONFIRMED' ? (
                          <button
                            onClick={() => handleCancel(b)}
                            disabled={busyId === b.id}
                            className="text-xs px-2.5 py-1 rounded-md text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            {busyId === b.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            Cancelar
                          </button>
                        ) : null}
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

function Summary({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
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
          <CalendarDays className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Booking['status'] }) {
  const map: Record<Booking['status'], { label: string; cls: string; Icon: any }> = {
    PENDING: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Loader2 },
    CONFIRMED: { label: 'Confirmada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
    REJECTED: { label: 'Rechazada', cls: 'bg-red-50 text-red-700 border-red-200', Icon: XCircle },
    CANCELED: { label: 'Cancelada', cls: 'bg-slate-100 text-slate-600 border-slate-200', Icon: XCircle },
    DONE: { label: 'Completada', cls: 'bg-blue-50 text-blue-700 border-blue-200', Icon: CheckCircle2 },
  };
  const cfg = map[status];
  const Icon = cfg.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.cls}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}
