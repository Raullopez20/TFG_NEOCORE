'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  servicesAPI,
  professionalsAPI,
  bookingsAPI,
  availabilityAPI,
  Service,
  Professional,
  TimeSlot,
} from '@/lib/api';
import { ArrowLeft, Calendar, Clock, User, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    service: searchParams.get('service') || '',
    professional: searchParams.get('professional') || '',
    date: '',
    time: '',
    notes: '',
  });

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Fetch available slots whenever professional / service / date change
  useEffect(() => {
    const svcId = Number(formData.service);
    const profId = Number(formData.professional);
    if (!svcId || !profId || !formData.date) {
      setAvailableSlots([]);
      setSlotsError(null);
      return;
    }
    const svc = services.find((s) => s.id === svcId);
    if (!svc) return;

    let cancelled = false;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSlotsError(null);
      // Clear selected time if date changed
      setFormData((prev) => ({ ...prev, time: '' }));
      try {
        const response = await availabilityAPI.getSlots({
          professional_id: profId,
          service_duration: svc.duration_minutes,
          start_date: formData.date,
          end_date: formData.date,
        });
        if (cancelled) return;
        const slots = Array.isArray((response as any).slots)
          ? (response as any).slots
          : Array.isArray(response)
          ? (response as any)
          : [];
        setAvailableSlots(slots);
        if (slots.length === 0) {
          setSlotsError('No hay horas disponibles para ese día. Prueba otra fecha.');
        }
      } catch (err: any) {
        if (cancelled) return;
        setAvailableSlots([]);
        setSlotsError('No se pudieron cargar las horas disponibles.');
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    };
    fetchSlots();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.service, formData.professional, formData.date, services]);

  const formatSlotTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const loadData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/es/login');
        return;
      }

      const [servicesData, profsData] = await Promise.all([
        servicesAPI.list(),
        professionalsAPI.list(),
      ]);

      setServices(servicesData);
      setProfessionals(profsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseApiErrors = (data: any): string => {
    if (!data) return 'Error al crear la reserva';
    if (typeof data === 'string') return data;
    if (data.non_field_errors) return data.non_field_errors.join('. ');
    if (data.detail) return data.detail;
    // Field-level errors: { "start_datetime": ["..."], "service": ["..."] }
    const fieldErrors = Object.entries(data)
      .filter(([, v]) => Array.isArray(v))
      .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
      .join('. ');
    return fieldErrors || 'Error al crear la reserva';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const svc = services.find((s) => s.id === Number(formData.service));
      if (!svc) {
        setError('Por favor selecciona un servicio');
        setSubmitting(false);
        return;
      }
      if (!formData.time) {
        setError('Por favor selecciona una hora disponible');
        setSubmitting(false);
        return;
      }

      // formData.time now contains the ISO start_datetime from the picked slot
      const startDatetime = new Date(formData.time);
      const endDatetime = new Date(
        startDatetime.getTime() + svc.duration_minutes * 60000
      );

      const bookingData = {
        service: Number(formData.service),
        professional: Number(formData.professional),
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
        client_notes: formData.notes,
      };

      await bookingsAPI.create(bookingData);
      setSuccess(true);
      setTimeout(() => router.push('/es/bookings'), 2000);
    } catch (err: any) {
      console.error('Error creating booking:', err);
      const msg = parseApiErrors(err.response?.data);
      // Translate common backend validation messages to Spanish
      const translations: Record<string, string> = {
        "Slot not within professional's availability": 'El horario seleccionado no está dentro de la disponibilidad del profesional. Los profesionales atienden de lunes a viernes, de 9:00 a 18:00.',
        'End time must be after start time': 'La hora de fin debe ser posterior a la hora de inicio.',
        'Cannot book appointments in the past': 'No se pueden crear reservas en el pasado.',
        'Slot overlaps with existing booking': 'El horario se solapa con una reserva existente.',
        'Professional is on time off during this period': 'El profesional está de baja durante este periodo.',
      };
      setError(translations[msg] || msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = services.find((s) => s.id === Number(formData.service));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <Link
            href="/es/services"
            className="inline-flex items-center text-white hover:text-blue-200 mb-4 group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Volver
          </Link>
          <h1 className="text-4xl font-bold mb-2">Nueva Reserva</h1>
          <p className="text-xl text-blue-100">Completa los datos para agendar tu cita</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Servicio
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecciona un servicio</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {service.duration_minutes} min
                        {service.price && ` - €${service.price}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Professional Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4" />
                    Profesional
                  </label>
                  <select
                    value={formData.professional}
                    onChange={(e) => setFormData({ ...formData, professional: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecciona un profesional</option>
                    {professionals.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.full_name} - {prof.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Available Slots */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4" />
                    Hora disponible
                  </label>

                  {!formData.service || !formData.professional || !formData.date ? (
                    <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500">
                      Selecciona servicio, profesional y fecha para ver las horas disponibles.
                    </div>
                  ) : slotsLoading ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Buscando horas disponibles...
                    </div>
                  ) : slotsError ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-sm text-amber-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{slotsError}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {availableSlots.map((slot) => {
                        const timeStr = formatSlotTime(slot.start_datetime);
                        const isSelected = formData.time === slot.start_datetime;
                        return (
                          <button
                            key={slot.start_datetime}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, time: slot.start_datetime })
                            }
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50'
                            }`}
                          >
                            {timeStr}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* Hidden required input so the form won't submit without a slot */}
                  <input type="hidden" value={formData.time} required readOnly />
                </div>

                {/* Notes */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4" />
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Información adicional que desees compartir con el profesional..."
                  />
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">Reserva creada con éxito. Redirigiendo...</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting || success}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold disabled:bg-gray-300"
                >
                  {submitting ? 'Creando reserva...' : 'Confirmar Reserva'}
                </Button>
              </form>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Resumen de Reserva</h3>

              {selectedService ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Servicio</p>
                    <p className="font-semibold text-gray-900">{selectedService.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Duración</p>
                    <p className="font-semibold text-gray-900">
                      {selectedService.duration_minutes} minutos
                    </p>
                  </div>

                  {selectedService.price && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Precio</p>
                      <p className="text-2xl font-bold text-blue-600">€{selectedService.price}</p>
                    </div>
                  )}

                  {formData.professional && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Profesional</p>
                      <p className="font-semibold text-gray-900">
                        {professionals.find((p) => p.id === Number(formData.professional))
                          ?.full_name || 'No seleccionado'}
                      </p>
                    </div>
                  )}

                  {formData.date && formData.time && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Fecha y Hora</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(formData.time).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                      <p className="text-gray-700">
                        {new Date(formData.time).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Selecciona un servicio para ver el resumen</p>
              )}

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>Recibirás una confirmación por email una vez que el profesional acepte tu reserva</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
