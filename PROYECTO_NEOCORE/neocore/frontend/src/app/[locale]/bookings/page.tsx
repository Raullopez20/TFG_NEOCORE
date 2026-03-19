'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { bookingsAPI, Booking } from '@/lib/api';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    const serviceName = (booking.service_info as { name?: string } | undefined)?.name ?? '';
    const professionalName = (booking.professional_info as { full_name?: string } | undefined)?.full_name ?? '';
    const term = searchTerm.toLowerCase();
    return (
      serviceName.toLowerCase().includes(term) ||
      professionalName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Mis Reservas</h1>
          <p className="text-xl text-blue-100">Gestiona todas tus citas en un solo lugar</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={() => setFilter('upcoming')}
                className={`${
                  filter === 'upcoming'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Próximas
              </Button>
              <Button
                onClick={() => setFilter('past')}
                className={`${
                  filter === 'past'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pasadas
              </Button>
              <Button
                onClick={() => setFilter('all')}
                className={`${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </Button>
            </div>

            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por servicio o profesional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron reservas
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'upcoming'
                ? 'No tienes citas programadas para el futuro'
                : filter === 'past'
                ? 'No tienes citas pasadas'
                : 'No tienes ninguna reserva'}
            </p>
            <a href="/es/services">
              <Button className="bg-blue-600 hover:bg-blue-700">Explorar Servicios</Button>
            </a>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} onUpdate={loadBookings} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking, onUpdate }: { booking: Booking; onUpdate: () => void }) {
  const statusConfig = {
    PENDING: {
      color: 'yellow',
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
      label: 'Pendiente',
      icon: Clock,
    },
    CONFIRMED: {
      color: 'green',
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      label: 'Confirmada',
      icon: CheckCircle,
    },
    REJECTED: {
      color: 'red',
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
      label: 'Rechazada',
      icon: XCircle,
    },
    CANCELED: {
      color: 'gray',
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-300',
      label: 'Cancelada',
      icon: XCircle,
    },
    DONE: {
      color: 'blue',
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-300',
      label: 'Completada',
      icon: CheckCircle,
    },
  };

  const config = statusConfig[booking.status as keyof typeof statusConfig];
  const Icon = config.icon;

  const handleCancel = async () => {
    if (confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      try {
        await bookingsAPI.cancel(booking.id);
        onUpdate();
      } catch (error) {
        console.error('Error canceling booking:', error);
        alert('Error al cancelar la reserva');
      }
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-md border-l-4 ${config.border} p-6 hover:shadow-lg transition-shadow`}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Image */}
        <div className="md:w-48 h-48 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={booking.service_info?.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=400&fit=crop'}
            alt={booking.service_info?.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {booking.service_info?.name || 'Servicio'}
              </h3>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>{booking.professional_info?.full_name || 'Profesional'}</span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text} flex items-center gap-1`}
            >
              <Icon className="w-4 h-4" />
              {config.label}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="font-medium">
                  {new Date(booking.start_datetime).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Hora</p>
                <p className="font-medium">
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

          {(booking.client_notes || (booking as { notes?: string }).notes) && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Notas:</span> {booking.client_notes || (booking as { notes?: string }).notes}
              </p>
            </div>
          )}

          {/* Actions */}
          {booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? (
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Cancelar Cita
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
