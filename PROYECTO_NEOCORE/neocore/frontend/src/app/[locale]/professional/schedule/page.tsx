'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Loader2,
  CalendarOff,
  ArrowLeft,
  Info
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
import { toast } from 'sonner';

const DAYS = [
  { value: 0, label: 'Lunes', short: 'Lun' },
  { value: 1, label: 'Martes', short: 'Mar' },
  { value: 2, label: 'Miércoles', short: 'Mié' },
  { value: 3, label: 'Jueves', short: 'Jue' },
  { value: 4, label: 'Viernes', short: 'Vie' },
  { value: 5, label: 'Sábado', short: 'Sáb' },
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

  // Formulario nueva ausencia
  const [offStart, setOffStart] = useState(todayISO());
  const [offEnd, setOffEnd] = useState(todayISO());
  const [offReason, setOffReason] = useState('');
  const [creatingOff, setCreatingOff] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        router.replace(`/${locale}/login`);
        return;
      }
      try {
        const me = await authAPI.me();
        if (cancelled) return;
        if (me.role !== 'PROFESSIONAL') {
          router.replace(me.role === 'ADMIN' ? `/${locale}/backoffice/dashboard` : `/${locale}/dashboard`);
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
    return () => { cancelled = true; };
  }, [locale, router]);

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
    if (newStart >= newEnd) {
      toast.error('Horario inválido', { description: 'La hora de inicio debe ser anterior a la de fin.' });
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
      toast.success('Franja añadida correctamente');
    } catch (err: any) {
      toast.error('Error al crear franja', { description: err.response?.data?.detail || 'Revisa los datos e intenta nuevamente.' });
    } finally {
      setCreatingRule(false);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm('¿Eliminar esta franja horaria?')) return;
    try {
      await availabilityAPI.deleteRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      toast.success('Franja eliminada');
    } catch {
      toast.error('Error', { description: 'No se pudo eliminar la franja.' });
    }
  };

  const handleCreateOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (offStart > offEnd) {
      toast.error('Fechas inválidas', { description: 'El inicio debe ser anterior o igual al fin.' });
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
      toast.success('Periodo de ausencia añadido');
    } catch (err: any) {
      toast.error('Error al añadir ausencia', { description: err.response?.data?.detail || 'Intenta nuevamente.' });
    } finally {
      setCreatingOff(false);
    }
  };

  const handleDeleteOff = async (id: number) => {
    if (!confirm('¿Eliminar este periodo de ausencia?')) return;
    try {
      await availabilityAPI.deleteTimeOff(id);
      setTimeOffs((prev) => prev.filter((t) => t.id !== id));
      toast.success('Ausencia eliminada');
    } catch {
      toast.error('Error', { description: 'No se pudo eliminar la ausencia.' });
    }
  };

  const rulesByDay: Record<number, AvailabilityRule[]> = {};
  DAYS.forEach((d) => (rulesByDay[d.value] = []));
  rules.forEach((r) => {
    if (rulesByDay[r.day_of_week]) rulesByDay[r.day_of_week].push(r);
  });
  Object.values(rulesByDay).forEach((arr) => arr.sort((a, b) => a.start_time.localeCompare(b.start_time)));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
          <p className="text-[13px] font-medium uppercase tracking-wide">Cargando horario</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24">
      {/* Dynamic Header */}
      <div className="bg-white/60 backdrop-blur-3xl border-b border-gray-200/50 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href={`/${locale}/dashboard`} className="inline-flex items-center text-[13px] font-medium text-gray-500 hover:text-[#0071e3] transition-colors mb-3">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver al dashboard
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-[28px] sm:text-[34px] font-bold text-gray-900 tracking-tight leading-tight">Configuración de Horario</h1>
              <p className="text-[14px] text-gray-500 mt-1">
                Define cuándo puedes recibir citas y bloquea ausencias o vacaciones.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly Rules */}
        <section className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden">
            <div className="px-7 py-6 border-b border-gray-100 flex items-center justify-between bg-white/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                   <Clock className="w-4 h-4 text-[#0071e3]" />
                </div>
                <h2 className="text-[18px] font-semibold text-gray-900 tracking-tight">Franjas Semanales Habituales</h2>
              </div>
              <span className="bg-blue-50 text-[#0071e3] px-3 py-1 rounded-full text-[12px] font-bold tracking-wide uppercase">
                {rules.length} {rules.length === 1 ? 'franja' : 'franjas'}
              </span>
            </div>

            <div className="p-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 mb-8">
                {DAYS.map((d) => (
                  <div key={d.value} className="bg-gray-50/50 border border-gray-200/60 rounded-[16px] p-3.5 flex flex-col items-center sm:items-start min-h-[140px] transition-colors hover:bg-gray-50">
                    <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3 w-full text-center sm:text-left border-b border-gray-200/60 pb-2">
                      {d.short}
                    </p>
                    {rulesByDay[d.value].length === 0 ? (
                      <p className="text-[12px] font-medium text-gray-400 italic text-center w-full mt-2">Libre</p>
                    ) : (
                      <ul className="space-y-2 w-full flex-1">
                        {rulesByDay[d.value].map((r) => (
                          <li key={r.id} className="group relative flex items-center justify-center sm:justify-start w-full bg-white border border-gray-200/80 text-gray-700 font-medium text-[12px] px-2.5 py-1.5 rounded-[10px] shadow-sm hover:border-[#0071e3] transition-colors">
                            <span>{r.start_time.slice(0, 5)} - {r.end_time.slice(0, 5)}</span>
                            <button onClick={() => handleDeleteRule(r.id)} className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 text-red-500 rounded p-1 hover:bg-red-100" title="Eliminar">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Rule */}
              <div className="bg-gray-50 rounded-[20px] p-5 border border-gray-200/60">
                 <p className="text-[14px] font-semibold text-gray-900 mb-4 tracking-tight">Añadir disponibilidad</p>
                 <form onSubmit={handleCreateRule} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                   <select value={newDay} onChange={(e) => setNewDay(Number(e.target.value))} className="h-10 px-3 bg-white border border-gray-200 rounded-[12px] text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-colors">
                     {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                   </select>
                   <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="h-10 px-3 bg-white border border-gray-200 rounded-[12px] text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-colors" />
                   <input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="h-10 px-3 bg-white border border-gray-200 rounded-[12px] text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-colors" />
                   <Button type="submit" disabled={creatingRule} className="h-10 bg-[#0071e3] hover:bg-[#005bb5] text-white rounded-[12px] font-medium text-[13px] shadow-sm">
                     {creatingRule ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1.5" /> Añadir</>}
                   </Button>
                 </form>
              </div>
            </div>
          </div>

           {/* Info Tip */}
           <div className="bg-white/60 backdrop-blur-lg border border-blue-100 rounded-[24px] p-6 flex gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
               <Info className="w-5 h-5 text-[#0071e3]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900 mb-1 tracking-tight">Sobre la disponibilidad</p>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                Las franjas que añades aquí se repiten todas las semanas. Si necesitas un bloque ocasional (vacaciones, congresos, indisposición), utiliza la sección de «Ausencias». El sistema restará estas ausencias de tu horario automáticamente.
              </p>
            </div>
          </div>
        </section>

        {/* Time Offs */}
        <section className="flex flex-col gap-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2.5 bg-white/40">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                 <CalendarOff className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-[17px] font-semibold text-gray-900 tracking-tight">Ausencias</h2>
            </div>

            <div className="p-6">
               <div className="bg-gray-50 border border-gray-200/60 rounded-[20px] p-4 mb-6">
                 <form onSubmit={handleCreateOff} className="flex flex-col gap-3">
                   <div>
                     <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5 ml-1">Fecha de inicio</label>
                     <input type="date" value={offStart} onChange={(e) => setOffStart(e.target.value)} className="w-full h-10 px-3 bg-white border border-gray-200 rounded-[12px] text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                   </div>
                   <div>
                     <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5 ml-1">Fecha de fin</label>
                     <input type="date" value={offEnd} onChange={(e) => setOffEnd(e.target.value)} className="w-full h-10 px-3 bg-white border border-gray-200 rounded-[12px] text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                   </div>
                   <div>
                     <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5 ml-1">Motivo (Opcional)</label>
                     <input type="text" value={offReason} onChange={(e) => setOffReason(e.target.value)} placeholder="Ej. Vacaciones de verano" className="w-full h-10 px-3 bg-white border border-gray-200 rounded-[12px] text-[13px] font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                   </div>
                   <Button type="submit" disabled={creatingOff} className="w-full h-10 mt-1 bg-amber-500 hover:bg-amber-600 text-white rounded-[12px] font-medium text-[13px] shadow-sm">
                     {creatingOff ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar Ausencia'}
                   </Button>
                 </form>
               </div>

              <div>
                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Próximos Bloqueos</p>
                {timeOffs.length === 0 ? (
                  <p className="text-[13px] font-medium text-gray-400 text-center py-6 bg-gray-50/50 rounded-[16px] border border-gray-100 border-dashed">
                    No tienes ausencias programadas.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {timeOffs.map((t) => (
                      <li key={t.id} className="flex flex-col gap-2 bg-white border border-gray-200/60 rounded-[16px] p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-colors hover:border-gray-300">
                        <div className="flex items-start justify-between">
                           <div className="flex flex-col">
                             <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md self-start mb-1.5 uppercase tracking-wide">
                               Ausencia Confirmada
                             </span>
                             <p className="text-[13.5px] font-semibold text-gray-900 tracking-tight">
                               {new Date(t.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – {new Date(t.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                             </p>
                             {t.reason && <p className="text-[12.5px] text-gray-500 font-medium mt-1">{t.reason}</p>}
                           </div>
                           <button onClick={() => handleDeleteOff(t.id)} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-1.5 rounded-full transition-colors" title="Cancelar Ausencia">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
