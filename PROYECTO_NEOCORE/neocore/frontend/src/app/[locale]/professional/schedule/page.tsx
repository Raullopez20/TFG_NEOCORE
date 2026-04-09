'use client';

/**
 * Pagina de gestion del horario del profesional.
 *
 * Permite al usuario con rol PROFESSIONAL:
 *  - Ver/anadir/eliminar reglas de disponibilidad semanal (AvailabilityRule).
 *  - Ver/anadir/eliminar periodos de ausencia (TimeOff).
 *
 * El acceso esta protegido: si el usuario no esta autenticado o no es
 * profesional se le redirige a /login o /dashboard segun corresponda.
 *
 * Los datos se obtienen siempre del usuario actual (no se pasa professional id),
 * porque el backend filtra automaticamente las reglas/ausencias del usuario
 * autenticado cuando no es admin.
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CalendarOff,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  authAPI,
  availabilityAPI,
  AvailabilityRule,
  TimeOff,
  User,
} from '@/lib/api';

const DAYS = [
  { value: 0, label: 'Lunes', short: 'Lun' },
  { value: 1, label: 'Martes', short: 'Mar' },
  { value: 2, label: 'Miercoles', short: 'Mie' },
  { value: 3, label: 'Jueves', short: 'Jue' },
  { value: 4, label: 'Viernes', short: 'Vie' },
  { value: 5, label: 'Sabado', short: 'Sab' },
  { value: 6, label: 'Domingo', short: 'Dom' },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ProfessionalSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'es';

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);

  // Formulario nueva regla
  const [newDay, setNewDay] = useState<number>(0);
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');
  const [creatingRule, setCreatingRule] = useState(false);
  const [ruleError, setRuleError] = useState<string | null>(null);

  // Formulario nueva ausencia
  const [offStart, setOffStart] = useState(todayISO());
  const [offEnd, setOffEnd] = useState(todayISO());
  const [offReason, setOffReason] = useState('');
  const [creatingOff, setCreatingOff] = useState(false);
  const [offError, setOffError] = useState<string | null>(null);

  // Feedback global (toast simple)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('access_token')
          : null;
      if (!token) {
        router.replace(`/${locale}/login`);
        return;
      }
      try {
        const me = await authAPI.me();
        if (cancelled) return;
        if (me.role !== 'PROFESSIONAL') {
          // Admins van al backoffice, clientes a su dashboard
          router.replace(
            me.role === 'ADMIN'
              ? `/${locale}/backoffice/dashboard`
              : `/${locale}/dashboard`
          );
          return;
        }
        setUser(me);
        await reload();
      } catch {
        router.replace(`/${locale}/login`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // Auto-ocultar toast tras 3 segundos
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const reload = async () => {
    const [r, o] = await Promise.all([
      availabilityAPI.getRules().catch(() => [] as AvailabilityRule[]),
      availabilityAPI.getTimeOffs().catch(() => [] as TimeOff[]),
    ]);
    setRules(r);
    setTimeOffs(o);
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setRuleError(null);
    if (newStart >= newEnd) {
      setRuleError('La hora de inicio debe ser anterior a la de fin.');
      return;
    }
    setCreatingRule(true);
    try {
      await availabilityAPI.createRule({
        day_of_week: newDay,
        start_time: newStart,
        end_time: newEnd,
      });
      await reload();
      setToast({ type: 'ok', msg: 'Franja anadida correctamente.' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, unknown> } };
      const data = error.response?.data;
      const msg =
        (data && (data.detail || data.non_field_errors || JSON.stringify(data))) ||
        'No se pudo crear la regla.';
      setRuleError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setCreatingRule(false);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm('Eliminar esta franja horaria?')) return;
    try {
      await availabilityAPI.deleteRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      setToast({ type: 'ok', msg: 'Franja eliminada.' });
    } catch {
      setToast({ type: 'err', msg: 'No se pudo eliminar la franja.' });
    }
  };

  const handleCreateOff = async (e: React.FormEvent) => {
    e.preventDefault();
    setOffError(null);
    if (offStart > offEnd) {
      setOffError('La fecha de inicio debe ser anterior o igual a la de fin.');
      return;
    }
    setCreatingOff(true);
    try {
      await availabilityAPI.createTimeOff({
        start_date: offStart,
        end_date: offEnd,
        reason: offReason || undefined,
      });
      await reload();
      setOffReason('');
      setToast({ type: 'ok', msg: 'Periodo de ausencia anadido.' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, unknown> } };
      const data = error.response?.data;
      const msg =
        (data && (data.detail || data.non_field_errors || JSON.stringify(data))) ||
        'No se pudo crear la ausencia.';
      setOffError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setCreatingOff(false);
    }
  };

  const handleDeleteOff = async (id: number) => {
    if (!confirm('Eliminar este periodo de ausencia?')) return;
    try {
      await availabilityAPI.deleteTimeOff(id);
      setTimeOffs((prev) => prev.filter((t) => t.id !== id));
      setToast({ type: 'ok', msg: 'Ausencia eliminada.' });
    } catch {
      setToast({ type: 'err', msg: 'No se pudo eliminar la ausencia.' });
    }
  };

  // Reglas agrupadas por dia para la vista semanal
  const rulesByDay: Record<number, AvailabilityRule[]> = {};
  DAYS.forEach((d) => (rulesByDay[d.value] = []));
  rules.forEach((r) => {
    if (rulesByDay[r.day_of_week]) {
      rulesByDay[r.day_of_week].push(r);
    }
  });
  Object.values(rulesByDay).forEach((arr) =>
    arr.sort((a, b) => a.start_time.localeCompare(b.start_time))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-600 text-sm">Cargando tu horario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
            toast.type === 'ok'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-10">
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center text-blue-100 hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al dashboard
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Mi horario y disponibilidad
              </h1>
              <p className="text-blue-100">
                Gestiona tus franjas semanales y tus periodos de ausencia.
              </p>
              {user && (
                <p className="text-blue-200 text-sm mt-1">
                  Conectado como <strong>{user.full_name || user.email}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Reglas semanales */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-slate-800">
                Franjas semanales
              </h2>
              <span className="ml-auto text-xs text-slate-500">
                {rules.length} {rules.length === 1 ? 'franja' : 'franjas'}
              </span>
            </div>

            <div className="p-6">
              {/* Vista semanal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 mb-6">
                {DAYS.map((d) => (
                  <div
                    key={d.value}
                    className="border border-slate-200 rounded-lg p-3 min-h-[110px]"
                  >
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      {d.short}
                    </p>
                    {rulesByDay[d.value].length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Sin franjas
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {rulesByDay[d.value].map((r) => (
                          <li
                            key={r.id}
                            className="group flex items-center justify-between bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            <span>
                              {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}
                            </span>
                            <button
                              onClick={() => handleDeleteRule(r.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* Formulario nueva regla */}
              <form
                onSubmit={handleCreateRule}
                className="border-t border-slate-100 pt-5"
              >
                <p className="text-sm font-medium text-slate-700 mb-3">
                  Anadir nueva franja
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(Number(e.target.value))}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DAYS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="submit"
                    disabled={creatingRule}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {creatingRule ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Anadir
                      </>
                    )}
                  </Button>
                </div>
                {ruleError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {ruleError}
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* Ausencias */}
        <section className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <CalendarOff className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-slate-800">Ausencias</h2>
              <span className="ml-auto text-xs text-slate-500">
                {timeOffs.length}
              </span>
            </div>

            <div className="p-6">
              <form onSubmit={handleCreateOff} className="space-y-3 mb-5">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={offStart}
                    onChange={(e) => setOffStart(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={offEnd}
                    onChange={(e) => setOffEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Motivo (opcional)
                  </label>
                  <input
                    type="text"
                    value={offReason}
                    onChange={(e) => setOffReason(e.target.value)}
                    placeholder="Vacaciones, congreso..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={creatingOff}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {creatingOff ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Anadir ausencia
                    </>
                  )}
                </Button>
                {offError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {offError}
                  </p>
                )}
              </form>

              <div className="border-t border-slate-100 pt-4">
                {timeOffs.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No tienes ausencias programadas.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {timeOffs.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-start justify-between gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-amber-900">
                            {new Date(t.start_date).toLocaleDateString('es-ES')}{' '}
                            – {new Date(t.end_date).toLocaleDateString('es-ES')}
                          </p>
                          {t.reason && (
                            <p className="text-xs text-amber-700 mt-0.5 truncate">
                              {t.reason}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteOff(t.id)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="flex gap-3">
              <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Como funciona
                </p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Las franjas semanales son recurrentes: si anades los lunes
                  9:00–13:00, estaras disponible todos los lunes en ese horario.
                  Las ausencias bloquean dias concretos, ideales para vacaciones
                  o eventos puntuales.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
