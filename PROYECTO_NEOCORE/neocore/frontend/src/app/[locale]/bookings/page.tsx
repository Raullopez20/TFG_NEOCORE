'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, bookingsAPI, Booking, User } from '@/lib/api';
import { Calendar, Clock, User as UserIcon, CheckCircle, XCircle, Search, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_CONFIG = {
  PENDING:   { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300',   label: 'Pendiente',   icon: Clock },
  CONFIRMED: { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300',    label: 'Confirmada',  icon: CheckCircle },
  REJECTED:  { bg: 'bg-red-100',     text: 'text-red-800',     border: 'border-red-300',     label: 'Rechazada',   icon: XCircle },
  CANCELED:  { bg: 'bg-gray-100',    text: 'text-gray-600',    border: 'border-gray-300',    label: 'Cancelada',   icon: XCircle },
  DONE:      { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: 'Completada',  icon: CheckCircle },
};

export default function BookingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/es/login'); return; }
    authAPI.me().then(user => { setMe(user); loadBookings(user); }).catch(() => router.push('/es/login'));
  }, []);

  useEffect(() => {
    if (me) loadBookings(me);
  }, [filter]);

  const loadBookings = async (user?: User) => {
    setLoading(true);
    try {
      let data: Booking[];
      if (filter === 'upcoming') data = await bookingsAPI.upcoming();
      else if (filter === 'past') data = await bookingsAPI.past();
      else data = await bookingsAPI.list();
      setBookings(data);
    } catch { console.error('Error loading bookings'); }
    finally { setLoading(false); }
  };

  const updateBooking = (id: number, patch: Partial<Booking>) =>
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));

  const removeBooking = (id: number) =>
    setBookings(prev => prev.filter(b => b.id !== id));

  const isProfessional = me?.role === 'PROFESSIONAL';
  const isAdmin = me?.role === 'ADMIN';

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const svcName = (b.service_info as any)?.name?.toLowerCase() ?? '';
    const profName = (b.professional_info as any)?.full_name?.toLowerCase() ?? '';
    const clientName = (b.client_info as any)?.full_name?.toLowerCase() ?? '';
    const clientEmail = (b.client_info as any)?.email?.toLowerCase() ?? '';
    return !q || svcName.includes(q) || profName.includes(q) || clientName.includes(q) || clientEmail.includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">{isProfessional ? 'Mis Citas' : 'Mis Reservas'}</h1>
          <p className="text-xl text-blue-100">
            {isProfessional ? 'Gestiona las citas de tus clientes' : 'Gestiona todas tus citas en un solo lugar'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border p-5 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            {(['upcoming', 'past', 'all'] as const).map(f => (
              <Button key={f} onClick={() => setFilter(f)}
                className={filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}>
                {f === 'upcoming' ? 'Próximas' : f === 'past' ? 'Pasadas' : 'Todas'}
              </Button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={isProfessional ? 'Buscar por cliente o servicio...' : 'Buscar por servicio o profesional...'}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-xl animate-pulse border" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Sin reservas</h3>
            <p className="text-gray-500 mb-6">{filter === 'upcoming' ? 'No tienes citas próximas' : filter === 'past' ? 'No tienes citas pasadas' : 'No tienes ninguna reserva'}</p>
            {!isProfessional && <a href="/es/services"><Button className="bg-blue-600 hover:bg-blue-700">Explorar servicios</Button></a>}
          </div>
        ) : (
          <div className="grid gap-5">
            {filtered.map(b => (
              <BookingCard key={b.id} booking={b} isProfessional={isProfessional} isAdmin={isAdmin}
                onCancel={(id) => removeBooking(id)}
                onConfirm={(id) => updateBooking(id, { status: 'CONFIRMED' as any })}
                onReject={(id) => updateBooking(id, { status: 'REJECTED' as any })}
                onDone={(id) => updateBooking(id, { status: 'DONE' as any })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tarjeta de reserva ────────────────────────────────────────────────────────
function BookingCard({ booking: b, isProfessional, isAdmin, onCancel, onConfirm, onReject, onDone }: {
  booking: Booking;
  isProfessional: boolean;
  isAdmin: boolean;
  onCancel: (id: number) => void;
  onConfirm: (id: number) => void;
  onReject: (id: number) => void;
  onDone: (id: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const cfg = STATUS_CONFIG[b.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.icon;

  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(iso).toLocaleString('es-ES', opts);

  const doAction = async (action: () => Promise<any>, cb: (id: number) => void) => {
    setBusy(true);
    try { await action(); cb(b.id); }
    catch (err: any) { alert(err?.response?.data?.detail || 'Error al procesar la acción.'); }
    finally { setBusy(false); }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-l-4 ${cfg.border} border border-r border-t border-b p-6 hover:shadow-md transition-shadow`}>
      <div className="flex flex-col md:flex-row gap-5">
        {/* Imagen */}
        <div className="md:w-36 h-36 rounded-xl overflow-hidden bg-gray-100 shrink-0">
          <img src={(b.service_info as any)?.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&h=300&fit=crop'}
            alt={(b.service_info as any)?.name} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Cabecera */}
          <div className="flex items-start justify-between mb-3 gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-0.5">{(b.service_info as any)?.name || 'Servicio'}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                {isProfessional
                  ? <span>Cliente: <strong className="text-gray-700">{(b.client_info as any)?.full_name || `#${b.client}`}</strong></span>
                  : <span>{(b.professional_info as any)?.full_name || 'Profesional'}</span>}
              </p>
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
              <StatusIcon className="w-3.5 h-3.5" /> {cfg.label}
            </span>
          </div>

          {/* Info cliente para profesional/admin */}
          {(isProfessional || isAdmin) && b.client_info && (
            <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-gray-600">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <a href={`mailto:${(b.client_info as any).email}`} className="hover:text-blue-600">{(b.client_info as any).email}</a>
              </span>
              {(b.client_info as any).phone && (
                <span className="flex items-center gap-1.5 text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-blue-500" />{(b.client_info as any).phone}
                </span>
              )}
            </div>
          )}

          {/* Fecha y hora */}
          <div className="flex flex-wrap gap-4 mb-3 text-sm">
            <span className="flex items-center gap-1.5 text-gray-700">
              <Calendar className="w-4 h-4 text-blue-500" />
              {fmt(b.start_datetime, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5 text-gray-700">
              <Clock className="w-4 h-4 text-blue-500" />
              {fmt(b.start_datetime, { hour: '2-digit', minute: '2-digit' })} – {fmt(b.end_datetime, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Notas */}
          {b.client_notes && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <span className="font-medium text-gray-700">Notas: </span>{b.client_notes}
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 mt-3">
            {/* Acciones de cliente */}
            {!isProfessional && !isAdmin && (b.status === 'PENDING' || b.status === 'CONFIRMED') && (
              <button disabled={busy} onClick={() => {
                if (confirm('¿Cancelar esta cita?'))
                  doAction(() => bookingsAPI.cancel(b.id), onCancel);
              }} className="text-sm px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium disabled:opacity-50 transition-colors">
                {busy ? 'Procesando...' : 'Cancelar cita'}
              </button>
            )}

            {/* Acciones de profesional */}
            {(isProfessional || isAdmin) && b.status === 'PENDING' && (
              <>
                <button disabled={busy} onClick={() => doAction(() => bookingsAPI.confirm(b.id), onConfirm)}
                  className="text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> {busy ? '...' : 'Confirmar'}
                </button>
                <button disabled={busy} onClick={() => {
                  const reason = prompt('Motivo del rechazo (opcional):') ?? '';
                  doAction(() => bookingsAPI.reject(b.id, reason), onReject);
                }} className="text-sm px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Rechazar
                </button>
              </>
            )}

            {(isProfessional || isAdmin) && b.status === 'CONFIRMED' && !b.is_past && (
              <button disabled={busy} onClick={() => doAction(() => bookingsAPI.cancel(b.id), onCancel)}
                className="text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium disabled:opacity-50 transition-colors">
                Cancelar
              </button>
            )}

            {(isProfessional || isAdmin) && b.status === 'CONFIRMED' && b.is_past && (
              <button disabled={busy} onClick={() => doAction(() => bookingsAPI.markDone(b.id), onDone)}
                className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Marcar como completada
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
