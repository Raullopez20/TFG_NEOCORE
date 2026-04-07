'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { bookingsAPI, reviewsAPI, Booking, Review } from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Star,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/es/login');
        return;
      }

      const data = await bookingsAPI.get(Number(bookingId));
      setBooking(data);

      // If booking is DONE, try to load the review (if any)
      if (data.status === 'DONE') {
        try {
          const reviews = await reviewsAPI.list({ booking: data.id });
          if (reviews.length > 0) setExistingReview(reviews[0]);
        } catch {
          // Ignore — no review yet is fine
        }
      }
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setReviewError(null);
    setReviewSubmitting(true);
    try {
      const review = await reviewsAPI.create({
        booking: booking.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setExistingReview(review);
    } catch (err: any) {
      const data = err?.response?.data;
      if (typeof data === 'string') setReviewError(data);
      else if (data?.detail) setReviewError(data.detail);
      else if (data?.non_field_errors) setReviewError(data.non_field_errors.join('. '));
      else setReviewError('No se pudo enviar la reseña. Inténtalo de nuevo.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;

    if (confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      try {
        await bookingsAPI.cancel(booking.id);
        await loadBookingDetails();
        alert('Cita cancelada correctamente');
      } catch (error) {
        console.error('Error canceling booking:', error);
        alert('Error al cancelar la cita');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reserva...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Reserva no encontrada</h2>
          <Link href="/es/bookings">
            <Button className="bg-blue-600 hover:bg-blue-700">Volver a Reservas</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = {
    PENDING: {
      color: 'yellow',
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
      label: 'Pendiente de Confirmación',
      icon: Clock,
      message:
        'Tu reserva está pendiente de confirmación por parte del profesional. Te notificaremos cuando sea confirmada.',
    },
    CONFIRMED: {
      color: 'green',
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      label: 'Confirmada',
      icon: CheckCircle,
      message: 'Tu cita ha sido confirmada. Te esperamos en la fecha y hora indicada.',
    },
    REJECTED: {
      color: 'red',
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
      label: 'Rechazada',
      icon: XCircle,
      message: 'Esta reserva ha sido rechazada. Por favor, elige otra fecha u horario.',
    },
    CANCELED: {
      color: 'gray',
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-300',
      label: 'Cancelada',
      icon: XCircle,
      message: 'Esta cita ha sido cancelada.',
    },
    DONE: {
      color: 'blue',
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-300',
      label: 'Completada',
      icon: CheckCircle,
      message: 'Esta cita se ha completado con éxito.',
    },
  };

  const config = statusConfig[booking.status as keyof typeof statusConfig];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/es/bookings"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Volver a Reservas
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detalles de la Reserva</h1>
              <p className="text-gray-600">ID: #{booking.id}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text} flex items-center gap-2`}
            >
              <Icon className="w-5 h-5" />
              {config.label}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Status Message */}
        <div className={`mb-8 p-4 border-l-4 ${config.border} ${config.bg} rounded-r-lg`}>
          <div className="flex items-start gap-3">
            <Icon className={`w-6 h-6 ${config.text} flex-shrink-0 mt-0.5`} />
            <p className={`${config.text} font-medium`}>{config.message}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Service Info */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-blue-500 to-blue-700">
                {booking.service_info?.image && (
                  <img
                    src={booking.service_info.image}
                    alt={booking.service_info.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-6 text-white">
                  <h2 className="text-3xl font-bold">{booking.service_info?.name || 'Servicio'}</h2>
                  <p className="text-blue-100">{booking.service_info?.description}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(booking.start_datetime).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Horario</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(booking.start_datetime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' - '}
                        {new Date(booking.end_datetime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Profesional Asignado</h3>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                  {booking.professional_info?.profile_image ? (
                    <img
                      src={booking.professional_info.profile_image}
                      alt={booking.professional_info.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {booking.professional_info?.full_name || 'Profesional'}
                  </h4>
                  <p className="text-gray-600">{booking.professional_info?.specialty}</p>
                  <Link
                    href={`/es/professionals/${booking.professional}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1 mt-1"
                  >
                    Ver perfil
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Notes */}
            {booking.client_notes && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notas de la Reserva
                </h3>
                <p className="text-gray-700">{booking.client_notes}</p>
              </div>
            )}

            {/* Actions */}
            {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Acciones</h3>
                <div className="flex gap-3">
                  <Button
                    onClick={handleCancel}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Cancelar Cita
                  </Button>
                </div>
              </div>
            )}

            {/* Review section: visible only if booking is DONE */}
            {booking.status === 'DONE' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Tu reseña
                </h3>

                {existingReview ? (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-6 h-6 ${
                            n <= existingReview.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {existingReview.comment && (
                      <p className="text-gray-700 italic">"{existingReview.comment}"</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Publicada el{' '}
                      {new Date(existingReview.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Comparte tu experiencia con otros pacientes. Tu opinión ayudará a
                      mejorar nuestro servicio.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valoración
                      </label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setReviewRating(n)}
                            className="focus:outline-none"
                            aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`w-8 h-8 transition-colors ${
                                n <= reviewRating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 hover:text-yellow-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comentario (opcional)
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={4}
                        maxLength={2000}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="¿Qué tal fue la experiencia?"
                      />
                    </div>
                    {reviewError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{reviewError}</p>
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                    >
                      {reviewSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Publicar reseña'
                      )}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Información de Contacto</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Ubicación</p>
                      <p className="font-medium">Calle Principal 123, Madrid</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium">+34 123 456 789</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-sm">info@neocore.com</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Detalles Adicionales</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duración</span>
                    <span className="font-medium">{booking.duration_minutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creada</span>
                    <span className="font-medium">
                      {new Date(booking.created_at || '').toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Recordatorio:</strong> Por favor llega 10 minutos antes de tu cita
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
