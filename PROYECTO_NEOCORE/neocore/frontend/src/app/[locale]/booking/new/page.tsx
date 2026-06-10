'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  servicesAPI, professionalsAPI, bookingsAPI, availabilityAPI,
  Service, Professional, TimeSlot,
} from '@/lib/api';
import { ArrowLeft, ArrowRight, Calendar, Clock, User, FileText, CheckCircle, Loader2, AlertCircle, Star } from 'lucide-react';
import { getProfessionalImage } from '@/lib/images';

const STEPS = ['Servicio', 'Profesional', 'Fecha y hora', 'Confirmar'];

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [sel, setSel] = useState({
    service: searchParams.get('service') || '',
    professional: searchParams.get('professional') || '',
    date: '',
    time: '',
    notes: '',
  });

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);

    const loadData = async () => {
      try {
        const [svcs, profs] = await Promise.all([servicesAPI.list(), professionalsAPI.list()]);
        setServices(svcs);
        setProfessionals(profs);

        // Restaurar selección: caché primero, luego parámetros URL
        const cached = localStorage.getItem('pending_booking');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setSel(prev => ({ ...prev, ...parsed }));
            if (parsed.service && parsed.professional) setStep(2);
            else if (parsed.service) setStep(1);
          } catch {}
        } else {
          const svcParam = searchParams.get('service');
          const profParam = searchParams.get('professional');
          if (svcParam && profParam) setStep(2);
          else if (svcParam) setStep(1);
        }
      } catch {}
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  // Cargar slots cuando cambian servicio/profesional/fecha
  useEffect(() => {
    if (!sel.service || !sel.professional || !sel.date) { setSlots([]); return; }
    const svc = services.find(s => s.id === Number(sel.service));
    if (!svc) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError('');
    setSel(prev => ({ ...prev, time: '' }));
    availabilityAPI.getSlots({
      professional_id: Number(sel.professional),
      service_duration: svc.duration_minutes,
      start_date: sel.date,
      end_date: sel.date,
    }).then(res => {
      if (cancelled) return;
      const list = Array.isArray((res as any).slots) ? (res as any).slots : Array.isArray(res) ? res : [];
      setSlots(list);
      if (list.length === 0) setSlotsError('No hay horas disponibles para ese día. Prueba otra fecha.');
    }).catch(() => {
      if (!cancelled) setSlotsError('No se pudieron cargar las horas.');
    }).finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [sel.service, sel.professional, sel.date, services]);

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const selService = services.find(s => s.id === Number(sel.service));
  const selProf = professionals.find(p => p.id === Number(sel.professional));

  const goNext = () => {
    // Guardar en caché para no-logueados
    localStorage.setItem('pending_booking', JSON.stringify(sel));
    if (step === 2 && !isLoggedIn) {
      // Antes de confirmar necesita cuenta
      router.push('/es/login?return=booking');
      return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!sel.time || !selService) { setError('Selecciona todos los campos'); return; }
    setSubmitting(true);
    setError('');
    try {
      const start = new Date(sel.time);
      const end = new Date(start.getTime() + selService.duration_minutes * 60000);
      await bookingsAPI.create({
        service: Number(sel.service),
        professional: Number(sel.professional),
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
        client_notes: sel.notes,
      });
      localStorage.removeItem('pending_booking');
      setSuccess(true);
    } catch (err: any) {
      const data = err?.response?.data;
      const msgs: Record<string, string> = {
        "Slot not within professional's availability": 'El horario no está dentro de la disponibilidad del profesional.',
        'Slot overlaps with existing booking': 'Ya hay una reserva en ese horario. Elige otra hora.',
        'Cannot book appointments in the past': 'No puedes reservar en el pasado.',
        'Only clients can create bookings': 'Solo los clientes pueden hacer reservas.',
      };
      const raw = data?.non_field_errors?.[0] || data?.detail || 'Error al crear la reserva';
      setError(msgs[raw] || raw);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500">Cargando...</p>
      </div>
    </div>
  );

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (success) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">¡Reserva enviada!</h1>
        <p className="text-gray-600 mb-2 text-lg">
          Tu solicitud ha sido enviada a <strong>{selProf?.full_name}</strong>.
        </p>
        <p className="text-gray-500 mb-8">
          El profesional revisará tu solicitud y te confirmará la cita. Recibirás un email cuando sea aceptada.
        </p>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Servicio</span>
            <span className="font-semibold text-gray-800">{selService?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Profesional</span>
            <span className="font-semibold text-gray-800">{selProf?.full_name}</span>
          </div>
          {sel.time && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fecha</span>
                <span className="font-semibold text-gray-800">{fmtDate(sel.date)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hora</span>
                <span className="font-semibold text-gray-800">{fmtTime(sel.time)}</span>
              </div>
            </>
          )}
          {selService?.price && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Precio</span>
              <span className="font-bold text-blue-600 text-base">€{selService.price}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/es/bookings"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm">
            Ver mis reservas
          </Link>
          <Link href="/es"
            className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 transition-colors">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );

  // ── Wizard ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-10">
        <div className="container mx-auto px-4">
          <Link href="/es/services" className="inline-flex items-center text-white/80 hover:text-white mb-5 group text-sm">
            <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" /> Volver
          </Link>
          <h1 className="text-3xl font-bold mb-1">Nueva Reserva</h1>
          <p className="text-blue-100">Sigue los pasos para agendar tu cita</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex">
            {STEPS.map((name, i) => (
              <div key={i} className={`flex-1 py-4 text-center text-sm font-medium border-b-2 transition-colors ${
                i === step ? 'border-blue-600 text-blue-600' :
                i < step ? 'border-emerald-500 text-emerald-600' :
                'border-transparent text-gray-400'}`}>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs mr-1.5 ${
                  i === step ? 'bg-blue-600 text-white' :
                  i < step ? 'bg-emerald-500 text-white' :
                  'bg-gray-200 text-gray-500'}`}>{i < step ? '✓' : i + 1}</span>
                <span className="hidden sm:inline">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="md:col-span-2">

            {/* PASO 0: Elegir servicio */}
            {step === 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">¿Qué servicio necesitas?</h2>
                <p className="text-gray-500 text-sm mb-6">Selecciona el tipo de consulta o tratamiento</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {services.map(svc => (
                    <button key={svc.id} type="button" onClick={() => setSel({ ...sel, service: String(svc.id), professional: '', time: '' })}
                      className={`p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                        sel.service === String(svc.id)
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                      {svc.image && (
                        <img src={svc.image} alt={svc.name} className="w-full h-28 object-cover rounded-lg mb-3" />
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        sel.service === String(svc.id) ? 'bg-blue-600' : 'bg-blue-100'}`}>
                        <Star className={`w-5 h-5 ${sel.service === String(svc.id) ? 'text-white' : 'text-blue-600'}`} />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{svc.name}</h3>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{svc.description}</p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-600"><Clock className="w-3.5 h-3.5" />{svc.duration_minutes} min</span>
                        {svc.price && <span className="font-bold text-blue-600">€{svc.price}</span>}
                      </div>
                      {sel.service === String(svc.id) && (
                        <div className="mt-2 flex items-center gap-1 text-blue-600 text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Seleccionado
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={goNext} disabled={!sel.service}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Siguiente <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* PASO 1: Elegir profesional */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">¿Con quién quieres la cita?</h2>
                <p className="text-gray-500 text-sm mb-6">Elige el profesional que mejor se adapte a ti</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {professionals.map(prof => (
                    <button key={prof.id} type="button" onClick={() => setSel({ ...sel, professional: String(prof.id), time: '' })}
                      className={`p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                        sel.professional === String(prof.id)
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden shrink-0">
                          <img src={prof.profile_image || getProfessionalImage(prof.specialty || '')} alt={prof.full_name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{prof.full_name}</h3>
                          {prof.specialty && <p className="text-sm text-blue-600">{prof.specialty}</p>}
                        </div>
                      </div>
                      {prof.bio && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{prof.bio}</p>}
                      {prof.average_rating && (
                        <div className="flex items-center gap-1 text-sm text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-semibold">{prof.average_rating}</span>
                          <span className="text-gray-400">({prof.reviews_count} reseñas)</span>
                        </div>
                      )}
                      {sel.professional === String(prof.id) && (
                        <div className="mt-2 flex items-center gap-1 text-blue-600 text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Seleccionado
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  <button onClick={() => setStep(0)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </button>
                  <button onClick={goNext} disabled={!sel.professional}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors">
                    Siguiente <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2: Fecha y hora */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">¿Cuándo quieres tu cita?</h2>
                <p className="text-gray-500 text-sm mb-6">Elige la fecha y la hora que mejor te venga</p>

                <div className="bg-white rounded-2xl border p-6 space-y-6">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" /> Selecciona una fecha
                    </label>
                    <input type="date" value={sel.date} min={new Date().toISOString().split('T')[0]}
                      onChange={e => setSel({ ...sel, date: e.target.value, time: '' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm" />
                  </div>

                  {sel.date && (
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-3">
                        <Clock className="w-4 h-4 text-blue-600" /> Horas disponibles
                      </label>
                      {slotsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Buscando horas disponibles...
                        </div>
                      ) : slotsError ? (
                        <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {slotsError}
                        </div>
                      ) : slots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {slots.map(slot => (
                            <button key={slot.start_datetime} type="button"
                              onClick={() => setSel({ ...sel, time: slot.start_datetime })}
                              className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                                sel.time === slot.start_datetime
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50'}`}>
                              {fmtTime(slot.start_datetime)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 text-center py-4">
                          Selecciona una fecha para ver horas disponibles
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!isLoggedIn && sel.date && sel.time && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                    <strong>Necesitas una cuenta para confirmar.</strong> Guardaremos tu selección y podrás completar la reserva tras iniciar sesión o registrarte.
                  </div>
                )}

                <div className="mt-6 flex justify-between">
                  <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </button>
                  <button onClick={goNext} disabled={!sel.date || !sel.time}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors">
                    {isLoggedIn ? <><span>Continuar</span><ArrowRight className="w-4 h-4" /></> : <><span>Iniciar sesión para confirmar</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: Confirmar */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Confirma tu reserva</h2>
                <p className="text-gray-500 text-sm mb-6">Revisa los detalles y añade notas si lo deseas</p>

                <div className="bg-white rounded-2xl border p-6 space-y-4 mb-6">
                  <h3 className="font-semibold text-gray-800 border-b pb-3">Resumen</h3>
                  {[
                    { label: 'Servicio', val: selService?.name },
                    { label: 'Profesional', val: selProf?.full_name },
                    { label: 'Fecha', val: sel.date ? fmtDate(sel.date) : '' },
                    { label: 'Hora', val: sel.time ? fmtTime(sel.time) : '' },
                    { label: 'Duración', val: selService ? `${selService.duration_minutes} min` : '' },
                    { label: 'Precio', val: selService?.price ? `€${selService.price}` : 'Consultar' },
                  ].map(({ label, val }) => val ? (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-semibold text-gray-900 text-right max-w-[60%]">{val}</span>
                    </div>
                  ) : null)}
                </div>

                <div className="bg-white rounded-2xl border p-6 mb-6">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-3">
                    <FileText className="w-4 h-4 text-blue-600" /> Notas para el profesional (opcional)
                  </label>
                  <textarea value={sel.notes} onChange={e => setSel({ ...sel, notes: e.target.value })} rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    placeholder="Cuéntale al profesional cualquier información relevante para tu cita..." />
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                  </div>
                )}

                <div className="flex justify-between">
                  <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50 transition-colors shadow-sm text-base">
                    {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Reservando...</> : <><CheckCircle className="w-5 h-5" /> Confirmar reserva</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar resumen */}
          <div className="hidden md:block">
            <div className="bg-white rounded-2xl border p-5 sticky top-4">
              <h3 className="font-bold text-gray-500 mb-4 text-xs uppercase tracking-wide">Tu selección</h3>
              <div className="space-y-3 text-sm">
                <SummaryRow icon={<Star className="w-4 h-4 text-blue-500" />} label="Servicio" val={selService?.name || '–'} />
                <SummaryRow icon={<User className="w-4 h-4 text-blue-500" />} label="Profesional" val={selProf?.full_name || '–'} />
                <SummaryRow icon={<Calendar className="w-4 h-4 text-blue-500" />} label="Fecha" val={sel.date ? fmtDate(sel.date) : '–'} />
                <SummaryRow icon={<Clock className="w-4 h-4 text-blue-500" />} label="Hora" val={sel.time ? fmtTime(sel.time) : '–'} />
              </div>
              {selService?.price && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Total estimado</span>
                    <span className="text-2xl font-black text-blue-600">€{selService.price}</span>
                  </div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t flex items-start gap-2 text-xs text-gray-500">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Recibirás una confirmación cuando el profesional acepte tu solicitud.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, val }: { icon: React.ReactNode; label: string; val: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="font-semibold text-gray-800 text-sm">{val}</p>
      </div>
    </div>
  );
}
