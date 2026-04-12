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
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const containerStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
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
      <div className="min-h-[calc(100vh-64px)] bg-[#f5f5f7] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
             <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <p className="text-[13px] font-medium text-gray-400">Cargando...</p>
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
        { name: 'Citas Hoy', value: todayCount, icon: CalendarClock, gradient: 'from-[#0071e3] to-[#0077ED]' },
        { name: 'Pendientes', value: pendingCount, icon: Clock, gradient: 'from-[#F59E0B] to-[#D97706]' },
        { name: 'Confirmadas', value: confirmedCount, icon: CheckCircle, gradient: 'from-[#34C759] to-[#30B753]' },
        { name: 'Total Próximas', value: bookings.length, icon: TrendingUp, gradient: 'from-[#5E5CE6] to-[#5856D6]' },
      ]
    : [
        { name: 'Próximas Citas', value: bookings.length, icon: Calendar, gradient: 'from-[#0071e3] to-[#0077ED]' },
        { name: 'Pendientes de confirmar', value: pendingCount, icon: Clock, gradient: 'from-[#F59E0B] to-[#D97706]' },
        { name: 'Confirmadas', value: confirmedCount, icon: CheckCircle, gradient: 'from-[#34C759] to-[#30B753]' },
        { name: 'Historial', value: bookings.length, icon: TrendingUp, gradient: 'from-[#5E5CE6] to-[#5856D6]' },
      ];

  const handleConfirm = async (id: number) => {
    try {
      await bookingsAPI.confirm(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'CONFIRMED' } : b))
      );
      toast.success('Reserva confirmada', { description: 'El cliente será notificado.' });
    } catch (err) {
      toast.error('Error al confirmar', { description: 'Ocurrió un problema, intenta de nuevo.' });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await bookingsAPI.reject(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      toast.success('Reserva rechazada', { description: 'La cita ha sido cancelada.' });
    } catch (err) {
      toast.error('Error al rechazar', { description: 'Ocurrió un problema, intenta de nuevo.' });
    }
  };

  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  /* ---------- quick-action definitions ---------- */
  type QuickAction = { title: string; subtitle: string; href: string; gradient: string };

  const quickActions: QuickAction[] = isProfessional
    ? [
        { title: 'Mi Agenda', subtitle: 'Revisa y gestiona tus citas próximas.', href: '/es/bookings', gradient: 'from-[#0071e3] to-[#005bb5]' },
        { title: 'Mi Horario', subtitle: 'Configura tus franjas semanales y ausencias.', href: '/es/professional/schedule', gradient: 'from-gray-900 to-gray-800' },
      ]
    : isAdmin
    ? [
        { title: 'Centro de Administración', subtitle: 'Métricas, usuarios, calendario global y más.', href: '/es/backoffice/dashboard', gradient: 'from-[#0071e3] to-[#005bb5]' },
        { title: 'Todas las Reservas', subtitle: 'Supervisa el volumen de citas del sistema.', href: '/es/bookings', gradient: 'from-gray-900 to-gray-800' },
      ]
    : [
        { title: 'Reservar Nueva Cita', subtitle: 'Descubre los servicios y elige tu profesional.', href: '/es/services', gradient: 'from-[#0071e3] to-[#005bb5]' },
        { title: 'Equipo Médico', subtitle: 'Conoce a nuestros especialistas calificados.', href: '/es/professionals', gradient: 'from-gray-900 to-gray-800' },
      ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f5f5f7] relative overflow-hidden pb-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        
        {/* ---- Header ---- */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
             <div>
                <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-widest mb-1 first-letter:uppercase">{todayFormatted}</p>
                <h1 className="text-[34px] sm:text-[40px] font-bold text-gray-900 tracking-tight leading-tight">
                  Hola, {user?.first_name}
                </h1>
             </div>
             {isAdmin && (
                <div className="bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-full px-4 py-2 flex items-center gap-2 self-start sm:self-auto shadow-sm">
                   <ShieldCheck className="w-4 h-4 text-blue-600" />
                   <span className="text-[13px] font-medium text-gray-700">Administrador</span>
                </div>
             )}
          </div>
        </motion.div>

        {/* ---- Stats Grid ---- */}
        <motion.div
          variants={containerStagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.name}
                variants={fadeUp}
                className="bg-white/70 backdrop-blur-xl rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 border border-white"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-5 shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-[32px] font-bold text-gray-900 leading-none tracking-tight mb-2">{stat.value}</p>
                <p className="text-[13px] font-medium text-gray-500 leading-tight">{stat.name}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
           {/* ---- Quick Actions ---- */}
           <motion.div
              variants={containerStagger}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-4"
           >
              <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-2">Accesos Rápidos</h2>
              {quickActions.map((action) => (
                <motion.div key={action.title} variants={fadeUp}>
                  <Link href={action.href}>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className={`relative overflow-hidden bg-gradient-to-br ${action.gradient} rounded-[28px] shadow-lg p-8 sm:p-10 text-white cursor-pointer hover:shadow-xl transition-all`}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <div className="pr-8">
                          <h3 className="text-[24px] font-bold mb-2 tracking-tight">{action.title}</h3>
                          <p className="text-white/80 text-[15px] leading-relaxed max-w-sm">{action.subtitle}</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
                           <ChevronRight className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      
                      {/* Decorative Background Element */}
                      <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
           </motion.div>

           {/* ---- Bookings List ---- */}
           <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/80 backdrop-blur-xl rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-white p-7 sm:p-8 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight">
                {isProfessional ? 'Tu Agenda Próxima' : 'Próximas Citas'}
              </h2>
              <Link href="/es/bookings" className="text-[13px] font-medium text-[#0071e3] hover:underline">
                Ver todas
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-16 flex-1 flex flex-col justify-center">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-5 border border-gray-100">
                  <Calendar className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-[17px] font-semibold text-gray-900 mb-2">
                  {isProfessional ? 'Agenda libre' : 'No tienes citas'}
                </h3>
                <p className="text-[14px] text-gray-500 mb-8 max-w-[250px] mx-auto">
                  {isProfessional
                    ? 'Cuando los clientes reserven contigo, aparecerán aquí.'
                    : 'Es el momento perfecto para agendar tu próxima sesión.'}
                </p>
                {!isProfessional && !isAdmin && (
                  <Link href="/es/services">
                    <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-8 py-5 text-[15px] shadow-sm">
                      Explorar Servicios
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
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
    PENDING: { bg: 'bg-[#F59E0B]/10', text: 'text-[#D97706]', label: 'Pendiente', icon: Clock },
    CONFIRMED: { bg: 'bg-[#34C759]/10', text: 'text-[#30B753]', label: 'Confirmada', icon: CheckCircle },
    REJECTED: { bg: 'bg-[#FF3B30]/10', text: 'text-[#FF3B30]', label: 'Rechazada', icon: XCircle },
    CANCELED: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Cancelada', icon: XCircle },
    DONE: { bg: 'bg-[#0071e3]/10', text: 'text-[#0071e3]', label: 'Completada', icon: CheckCircle },
  };

  const config = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.PENDING;
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
    <div className="bg-gray-50/80 rounded-[20px] p-5 border border-gray-100/80 transition-all hover:bg-gray-50">
      <div className="flex flex-col gap-4">
        {/* Header Info */}
        <div className="flex items-start justify-between">
          <div>
             <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase mb-2 ${config.bg} ${config.text}`}>
               <Icon className="w-3 h-3" />
               {config.label}
             </span>
             <h4 className="font-semibold text-gray-900 text-[15px] leading-tight">
               {booking.service_info?.name || 'Servicio General'}
             </h4>
          </div>
          <Link href={`/es/bookings/${booking.id}`} className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-4 border-t border-gray-200/60 pt-3 text-[13px] text-gray-600 font-medium">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            {new Date(booking.start_datetime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            {new Date(booking.start_datetime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Client info for professionals */}
        {isProfessional && booking.client_info && (
          <div className="flex items-center gap-2 text-[13px] text-gray-600 pt-1">
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{booking.client_info.full_name || booking.client_info.email}</span>
          </div>
        )}

        {/* Actions */}
        {canAct && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={runConfirm}
              disabled={actionLoading !== null}
              className="flex-1 h-9 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[13px] font-medium"
            >
              {actionLoading === 'confirm' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
            </Button>
            <Button
              onClick={runReject}
              disabled={actionLoading !== null}
              variant="outline"
               className="flex-1 h-9 rounded-xl text-[13px] font-medium border-red-200 text-red-600 hover:bg-red-50"
            >
              {actionLoading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rechazar'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
