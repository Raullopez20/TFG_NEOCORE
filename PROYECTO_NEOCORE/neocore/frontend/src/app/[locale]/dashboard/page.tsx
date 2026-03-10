'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, bookingsAPI, User, Booking } from '@/lib/api';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Activity,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/es/login');
        return;
      }

      const userData = await authAPI.me();
      setUser(userData);

      const bookingsData = await bookingsAPI.upcoming();
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/es/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      router.push('/es');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

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

  const stats = [
    {
      name: 'Próximas Citas',
      value: bookings.length,
      icon: Calendar,
      color: 'blue',
    },
    {
      name: 'Pendientes',
      value: bookings.filter((b) => b.status === 'PENDING').length,
      icon: Clock,
      color: 'yellow',
    },
    {
      name: 'Confirmadas',
      value: bookings.filter((b) => b.status === 'CONFIRMED').length,
      icon: CheckCircle,
      color: 'green',
    },
    {
      name: 'Total',
      value: bookings.length,
      icon: TrendingUp,
      color: 'purple',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ¡Bienvenido, {user?.first_name}!
              </h1>
              <p className="text-gray-600">
                {user?.role === 'CLIENT'
                  ? 'Cliente'
                  : user?.role === 'PROFESSIONAL'
                  ? 'Profesional'
                  : 'Administrador'}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'bg-blue-500',
              yellow: 'bg-yellow-500',
              green: 'bg-green-500',
              purple: 'bg-purple-500',
            };

            return (
              <div
                key={stat.name}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 ${
                      colorClasses[stat.color as keyof typeof colorClasses]
                    } rounded-lg flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{stat.name}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link href="/es/services">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-md p-8 text-white hover:shadow-xl transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">Nuevo Servicio</h3>
                <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
              </div>
              <p className="text-blue-100">
                Reserva una nueva cita con nuestros profesionales
              </p>
            </div>
          </Link>

          <Link href="/es/professionals">
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-md p-8 text-white hover:shadow-xl transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">Ver Profesionales</h3>
                <Users className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-purple-100">
                Explora nuestro equipo de expertos certificados
              </p>
            </div>
          </Link>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Próximas Citas</h2>
            <Link href="/es/bookings">
              <Button className="bg-blue-600 hover:bg-blue-700">Ver Todas</Button>
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No tienes citas programadas
              </h3>
              <p className="text-gray-600 mb-4">
                ¡Agenda tu primera cita con nosotros!
              </p>
              <Link href="/es/services">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Explorar Servicios
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const statusConfig = {
    PENDING: {
      color: 'yellow',
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Pendiente',
      icon: Clock,
    },
    CONFIRMED: {
      color: 'green',
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Confirmada',
      icon: CheckCircle,
    },
    REJECTED: {
      color: 'red',
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Rechazada',
      icon: XCircle,
    },
    CANCELED: {
      color: 'gray',
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: 'Cancelada',
      icon: XCircle,
    },
    DONE: {
      color: 'blue',
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Completada',
      icon: CheckCircle,
    },
  };

  const config = statusConfig[booking.status as keyof typeof statusConfig];
  const Icon = config.icon;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-gray-900">
              {booking.service_info?.name || 'Servicio'}
            </h4>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} flex items-center gap-1`}
            >
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(booking.start_datetime).toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(booking.start_datetime).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
        <Link href={`/es/bookings/${booking.id}`}>
          <Button className="bg-gray-100 hover:bg-gray-200 text-gray-900">
            Ver Detalles
          </Button>
        </Link>
      </div>
    </div>
  );
}
