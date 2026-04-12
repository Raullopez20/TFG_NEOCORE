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
  TrendingUp,
  Users,
  CalendarClock,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const containerStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/60 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  const isProfessional = user?.role === 'PROFESSIONAL';
  const isAdmin = user?.role === 'ADMIN';

  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;

  // Today's bookings (for professionals)
  const todayStr = new Date().toDateString();
  const todayCount = bookings.filter(
    (b) => new Date(b.start_datetime).toDateString() === todayStr
  ).length;

  const stats = isProfessional
    ? [
        { name: 'Hoy', value: todayCount, icon: CalendarClock, gradient: 'from-blue-500 to-blue-600' },
        { name: 'Pendientes de confirmar', value: pendingCount, icon: Clock, gradient: 'from-amber-400 to-amber-500' },
        { name: 'Confirmadas proximas', value: confirmedCount, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600' },
        { name: 'Total proximas', value: bookings.length, icon: TrendingUp, gradient: 'from-violet-500 to-violet-600' },
      ]
    : [
        { name: 'Proximas Citas', value: bookings.length, icon: Calendar, gradient: 'from-blue-500 to-blue-600' },
        { name: 'Pendientes', value: pendingCount, icon: Clock, gradient: 'from-amber-400 to-amber-500' },
        { name: 'Confirmadas', value: confirmedCount, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600' },
        { name: 'Total', value: bookings.length, icon: TrendingUp, gradient: 'from-violet-500 to-violet-600' },
      ];

  const handleConfirm = async (id: number) => {
    try {
      await bookingsAPI.confirm(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'CONFIRMED' } : b))
      );
    } catch (err) {
      console.error('Error confirming booking:', err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await bookingsAPI.reject(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Error rejecting booking:', err);
    }
  };

  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  /* ---------- quick-action definitions ---------- */
  type QuickAction = { title: string; subtitle: string; href: string; gradient: string };

  const quickActions: QuickAction[] = isProfessional
    ? [
        { title: 'Mi Agenda', subtitle: 'Revisa y gestiona tus citas proximas.', href: '/es/bookings', gradient: 'from-blue-500 to-blue-600' },
        { title: 'Mi Horario', subtitle: 'Configura tus franjas semanales y ausencias.', href: '/es/professional/schedule', gradient: 'from-violet-500 to-violet-600' },
      ]
    : isAdmin
    ? [
        { title: 'Backoffice', subtitle: 'Panel de administracion: KPIs, usuarios, reservas y servicios.', href: '/es/backoffice/dashboard', gradient: 'from-blue-500 to-blue-600' },
        { title: 'Todas las Reservas', subtitle: 'Supervisa las citas del sistema.', href: '/es/bookings', gradient: 'from-violet-500 to-violet-600' },
      ]
    : [
        { title: 'Reservar Cita', subtitle: 'Reserva una nueva cita con nuestros profesionales.', href: '/es/services', gradient: 'from-blue-500 to-blue-600' },
        { title: 'Ver Profesionales', subtitle: 'Explora nuestro equipo de expertos certificados.', href: '/es/professionals', gradient: 'from-violet-500 to-violet-600' },
      ];

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* ---- Header ---- */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Hola, {user?.first_name}
          </h1>
          <p className="text-gray-500 mt-1 capitalize">{todayFormatted}</p>
        </motion.div>

        {/* ---- Stats Grid ---- */}
        <motion.div
          variants={containerStagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.name}
                variants={fadeUp}
                className="bg-white rounded-2xl shadow-apple p-6 border border-gray-100"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.name}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ---- Quick Actions ---- */}
        <motion.div
          variants={containerStagger}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 gap-5 mb-10"
        >
          {quickActions.map((action) => (
            <motion.div key={action.title} variants={fadeUp}>
              <Link href={action.href}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                  className={`relative overflow-hidden bg-gradient-to-br ${action.gradient} rounded-2xl shadow-apple p-7 text-white cursor-pointer hover:shadow-apple-lg transition-shadow`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{action.title}</h3>
                      <p className="text-white/80 text-sm">{action.subtitle}</p>
                    </div>
                    <ArrowRight className="w-6 h-6 flex-shrink-0 opacity-80" />
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* ---- Bookings List ---- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="bg-white rounded-2xl shadow-apple border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {isProfessional ? 'Tu Agenda Proxima' : 'Proximas Citas'}
            </h2>
            <Link href="/es/bookings">
              <Button className="bg-blue-600 hover:bg-blue-700 text-sm rounded-xl">
                Ver Todas
              </Button>
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {isProfessional
                  ? 'No tienes citas proximas'
                  : 'No tienes citas programadas'}
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                {isProfessional
                  ? 'Cuando los clientes reserven contigo, apareceran aqui.'
                  : 'Agenda tu primera cita con nosotros!'}
              </p>
              {!isProfessional && !isAdmin && (
                <Link href="/es/services">
                  <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                    Explorar Servicios
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  isProfessional={isProfessional}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/* ================================================================
   BookingCard sub-component
   ================================================================ */

function BookingCard({
  booking,
  isProfessional,
  onConfirm,
  onReject,
}: {
  booking: Booking;
  isProfessional: boolean;
  onConfirm: (id: number) => void | Promise<void>;
  onReject: (id: number) => void | Promise<void>;
}) {
  const [actionLoading, setActionLoading] = useState<null | 'confirm' | 'reject'>(null);

  const statusConfig = {
    PENDING: {
      border: 'border-l-amber-400',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      label: 'Pendiente',
      icon: Clock,
    },
    CONFIRMED: {
      border: 'border-l-emerald-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      label: 'Confirmada',
      icon: CheckCircle,
    },
    REJECTED: {
      border: 'border-l-red-400',
      bg: 'bg-red-50',
      text: 'text-red-700',
      label: 'Rechazada',
      icon: XCircle,
    },
    CANCELED: {
      border: 'border-l-gray-300',
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      label: 'Cancelada',
      icon: XCircle,
    },
    DONE: {
      border: 'border-l-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      label: 'Completada',
      icon: CheckCircle,
    },
  };

  const config = statusConfig[booking.status as keyof typeof statusConfig];
  const Icon = config.icon;
  const canAct = isProfessional && booking.status === 'PENDING';

  const runConfirm = async () => {
    setActionLoading('confirm');
    try {
      await onConfirm(booking.id);
    } finally {
      setActionLoading(null);
    }
  };

  const runReject = async () => {
    setActionLoading('reject');
    try {
      await onReject(booking.id);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div
      className={`border-l-4 ${config.border} bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-5 py-4 hover:shadow-apple transition-shadow`}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Left info */}
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-3 mb-1.5">
            <h4 className="font-semibold text-gray-900 text-sm">
              {booking.service_info?.name || 'Servicio'}
            </h4>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
            >
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(booking.start_datetime).toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(booking.start_datetime).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {isProfessional && booking.client_info && (
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {booking.client_info.full_name || booking.client_info.email}
              </span>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {canAct && (
            <>
              <Button
                onClick={runConfirm}
                disabled={actionLoading !== null}
                className="h-8 px-3 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
              >
                {actionLoading === 'confirm' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Confirmar'
                )}
              </Button>
              <Button
                onClick={runReject}
                disabled={actionLoading !== null}
                className="h-8 px-3 text-xs rounded-lg bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-60"
              >
                {actionLoading === 'reject' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Rechazar'
                )}
              </Button>
            </>
          )}
          <Link href={`/es/bookings/${booking.id}`}>
            <Button className="h-8 px-3 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">
              Ver Detalles
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
