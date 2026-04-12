'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { bookingsAPI, Booking } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Search,
  CalendarX2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const filterTabs = [
  { key: 'upcoming' as const, label: 'Proximas' },
  { key: 'past' as const, label: 'Pasadas' },
  { key: 'all' as const, label: 'Todas' },
];

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/es/login');
        return;
      }

      let data;
      if (filter === 'upcoming') {
        data = await bookingsAPI.upcoming();
      } else if (filter === 'past') {
        data = await bookingsAPI.past();
      } else {
        data = await bookingsAPI.list();
      }
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const serviceName =
      (booking.service_info as { name?: string } | undefined)?.name ?? '';
    const professionalName =
      (booking.professional_info as { full_name?: string } | undefined)
        ?.full_name ?? '';
    const term = searchTerm.toLowerCase();
    return (
      serviceName.toLowerCase().includes(term) ||
      professionalName.toLowerCase().includes(term)
    );
  });

  const emptyMessage =
    filter === 'upcoming'
      ? 'No tienes citas programadas para el futuro'
      : filter === 'past'
        ? 'No tienes citas pasadas'
        : 'No tienes ninguna reserva';

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
              <p className="mt-1 text-gray-500">
                Gestiona todas tus citas en un solo lugar
              </p>
            </div>

            {/* Filter pills + search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex gap-1 bg-gray-100 rounded-full p-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      filter === tab.key
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar servicio o profesional..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-premium !pl-10 !py-2.5 !text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-apple p-6 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-1 h-14 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-1/4" />
                  </div>
                  <div className="h-7 w-24 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-apple p-16 text-center"
          >
            <CalendarX2 className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron reservas
            </h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">{emptyMessage}</p>
            <a href="/es/services">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6">
                Explorar Servicios
              </Button>
            </a>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {filteredBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.35 }}
                >
                  <BookingCard booking={booking} onUpdate={loadBookings} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Booking Card                                                       */
/* ------------------------------------------------------------------ */

const statusConfig = {
  PENDING: {
    dot: 'bg-yellow-400',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-l-yellow-400',
    label: 'Pendiente',
    icon: Clock,
  },
  CONFIRMED: {
    dot: 'bg-green-500',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-l-green-500',
    label: 'Confirmada',
    icon: CheckCircle,
  },
  REJECTED: {
    dot: 'bg-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-l-red-500',
    label: 'Rechazada',
    icon: XCircle,
  },
  CANCELED: {
    dot: 'bg-gray-400',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-l-gray-400',
    label: 'Cancelada',
    icon: XCircle,
  },
  DONE: {
    dot: 'bg-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-l-blue-500',
    label: 'Completada',
    icon: CheckCircle,
  },
} as const;

function BookingCard({
  booking,
  onUpdate,
}: {
  booking: Booking;
  onUpdate: () => void;
}) {
  const config =
    statusConfig[booking.status as keyof typeof statusConfig] ??
    statusConfig.PENDING;

  const handleCancel = async () => {
    if (confirm('¿Estas seguro de que quieres cancelar esta cita?')) {
      try {
        await bookingsAPI.cancel(booking.id);
        onUpdate();
      } catch (error) {
        console.error('Error canceling booking:', error);
        toast.error('Error al cancelar la reserva');
      }
    }
  };

  const dateStr = new Date(booking.start_datetime).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const startTime = new Date(booking.start_datetime).toLocaleTimeString(
    'es-ES',
    { hour: '2-digit', minute: '2-digit' },
  );
  const endTime = new Date(booking.end_datetime).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const notes =
    booking.client_notes || (booking as { notes?: string }).notes || '';

  return (
    <div
      className={`bg-white rounded-2xl shadow-apple overflow-hidden border-l-4 ${config.border} hover:shadow-apple-lg transition-shadow duration-200`}
    >
      <div className="px-6 py-5">
        {/* Main row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Service + professional */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {booking.service_info?.name || 'Servicio'}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-gray-500 text-sm">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {booking.professional_info?.full_name || 'Profesional'}
              </span>
            </div>
          </div>

          {/* Date & time */}
          <div className="flex items-center gap-4 text-sm text-gray-600 flex-shrink-0">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              {dateStr}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              {startTime} - {endTime}
            </span>
          </div>

          {/* Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} flex-shrink-0`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </span>

          {/* Cancel action */}
          {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
            <Button
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700 text-white text-sm rounded-full px-4 py-1.5 h-auto flex-shrink-0"
            >
              Cancelar
            </Button>
          )}
        </div>

        {/* Notes */}
        {notes && (
          <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Notas:</span> {notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
