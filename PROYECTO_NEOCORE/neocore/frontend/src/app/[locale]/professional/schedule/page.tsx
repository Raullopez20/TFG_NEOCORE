'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, availabilityAPI, bookingsAPI, AvailabilityRule, Booking, User } from '@/lib/api';
import { Clock, CheckCircle2, Loader2, ArrowLeft, Calendar, XCircle, AlertTriangle } from 'lucide-react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const STATUS_LABELS: Record<string, string> = { PENDING: 'Pendiente', CONFIRMED: 'Confirmada', DONE: 'Completada', CANCELED: 'Cancelada', REJECTED: 'Rechazada' };
const STATUS_COLORS: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', CONFIRMED: 'bg-blue-100 text-blue-700', DONE: 'bg-emerald-100 text-emerald-700', CANCELED: 'bg-slate-100 text-slate-500', REJECTED: 'bg-red-100 text-red-600' };

export default function ProfessionalSchedulePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [drafts, setDrafts] = useState<Record<number, { enabled: boolean; start: string; end: string }>>(() => {
    const d: Record<number, { enabled: boolean; start: string; end: string }> = {};
    for (let i = 0; i < 7; i++) d[i] = { enabled: false, start: '09:00', end: '18:00' };
    return d;
  });

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) { router.push('/es/login'); return; }
      try {
        const me = await authAPI.me();
        if (me.role !== 'PROFESSIONAL') { router.push('/es/dashboard'); return; }
        setUser(me);
        const [rulesData, bookingsData] = await Promise.all([
          availabilityAPI.getRules(),
          bookingsAPI.upcoming().catch(() => [] as Booking[]),
        ]);
        setRules(rulesData);
        const updated: Record<number, { enabled: boolean; start: string; end: string }> = {};
        for (let i = 0; i < 7; i++) updated[i] = { enabled: false, start: '09:00', end: '18:00' };
        rulesData.forEach(r => {
          updated[r.day_of_week] = { enabled: r.is_active, start: r.start_time.slice(0, 5), end: r.end_time.slice(0, 5) };
        });
        setDrafts(updated);
        setBookings(bookingsData.slice(0, 10));
      } catch {
        router.push('/es/login');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const getRuleForDay = (day: number) => rules.find(r => r.day_of_week === day);
  const setDraft = (day: number, key: string, val: any) =>
    setDrafts(prev => ({ ...prev, [day]: { ...prev[day], [key]: val } }));

  const handleSaveDay = async (day: number) => {
    const draft = drafts[day];
    const existing = getRuleForDay(day);
    setSaving(day);
    try {
      if (!draft.enabled) {
        if (existing) {
          await availabilityAPI.deleteRule(existing.id);
          setRules(prev => prev.filter(r => r.id !== existing.id));
        }
      } else {
        if (existing) {
          const updated = await availabilityAPI.updateRule(existing.id, { start_time: draft.start + ':00', end_time: draft.end + ':00', is_active: true });
          setRules(prev => prev.map(r => r.id === existing.id ? updated : r));
        } else {
          const created = await availabilityAPI.createRule({ day_of_week: day, start_time: draft.start + ':00', end_time: draft.end + ':00' });
          setRules(prev => [...prev, created]);
        }
      }
    } catch (err: any) {
      alert(err?.response?.data?.non_field_errors?.[0] || 'Error al guardar el horario');
      setSaved(prev => ({ ...prev, [day]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [day]: false })), 3000);
    } finally {
      setSaving(null);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await bookingsAPI.confirm(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CONFIRMED' as any } : b));
    } catch { alert('No se ha podido confirmar la reserva.'); }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Motivo del rechazo (opcional):') ?? '';
    try {
      await bookingsAPI.reject(id, reason);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'REJECTED' as any } : b));
    } catch { alert('No se ha podido rechazar la reserva.'); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" /><p className="text-gray-500">Cargando...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <Link href="/es/dashboard" className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Volver al dashboard
          </Link>
          <h1 className="text-3xl font-bold">Mi Horario</h1>
          <p className="text-blue-200 mt-1">{user?.full_name} · {user?.specialty || 'Profesional'}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {rules.length === 0 && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Sin horario configurado</p>
              <p className="text-sm text-amber-700 mt-0.5">Los clientes no podrán reservar citas contigo hasta que configures al menos un día disponible.</p>
            </div>
          </div>
        )}

        {/* Horario semanal */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Disponibilidad semanal</h2>
          </div>
          <div className="space-y-3">
            {DAYS.map((dayName, i) => {
              const draft = drafts[i];
              const isBusy = saving === i;
              const isSaved = saved[i];
              const hasRule = !!getRuleForDay(i);
              return (
                <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                  isSaved ? 'border-emerald-400 bg-emerald-50' :
                  draft.enabled ? 'border-blue-200 bg-blue-50/40' :
                  'border-slate-200 bg-slate-50'}`}>
                  <input type="checkbox" checked={draft.enabled} onChange={e => setDraft(i, 'enabled', e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
                  <div className="w-24 shrink-0">
                    <span className={`text-sm font-semibold ${draft.enabled ? 'text-gray-800' : 'text-gray-400'}`}>{dayName}</span>
                    {hasRule && !isSaved && (
                      <span className="block text-xs text-emerald-600 font-medium">✓ Guardado</span>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 flex-1 transition-opacity ${!draft.enabled ? 'opacity-25 pointer-events-none' : ''}`}>
                    <input type="time" value={draft.start} onChange={e => setDraft(i, 'start', e.target.value)} className="px-2.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-white font-medium" />
                    <span className="text-gray-400 text-sm">—</span>
                    <input type="time" value={draft.end} onChange={e => setDraft(i, 'end', e.target.value)} className="px-2.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-white font-medium" />
                  </div>
                  <button onClick={() => handleSaveDay(i)} disabled={isBusy}
                    className={`text-xs px-3 py-2 rounded-lg font-semibold disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0 transition-colors ${
                      isSaved ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {isSaved ? '¡Guardado!' : 'Guardar'}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">✓ verde = día configurado · Desmarca y guarda para desactivar un día.</p>
        </div>

        {/* Próximas citas */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Próximas citas</h2>
            </div>
            <Link href="/es/bookings" className="text-sm text-blue-600 hover:underline">Ver todas →</Link>
          </div>
          {bookings.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No hay citas próximas</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map(b => (
                <div key={b.id} className="py-3 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{(b as any).client_name || 'Cliente'}</p>
                    <p className="text-xs text-gray-500">{(b as any).service_name || 'Servicio'} · {new Date(b.start_datetime).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] || 'bg-slate-100 text-slate-500'}`}>{STATUS_LABELS[b.status] || b.status}</span>
                  {b.status === 'PENDING' && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleConfirm(b.id)} className="text-xs px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Confirmar
                      </button>
                      <button onClick={() => handleReject(b.id)} className="text-xs px-2 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
