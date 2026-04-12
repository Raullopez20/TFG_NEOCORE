'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Sparkles,
  LogOut,
  ShieldCheck,
  Loader2,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { authAPI, User } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const locale = pathname.split('/')[1] || 'es';

  useEffect(() => {
    let mounted = true;

    const verifyAdmin = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        router.replace(`/${locale}/login`);
        return;
      }
      try {
        const me = await authAPI.me();
        if (!mounted) return;
        if (me.role !== 'ADMIN') {
          router.replace(`/${locale}/dashboard`);
          return;
        }
        setUser(me);
      } catch {
        router.replace(`/${locale}/login`);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    verifyAdmin();
    return () => { mounted = false; };
  }, [locale, router]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    router.push(`/${locale}/login`);
  };

  const navigation = [
    { name: 'Dashboard', href: `/${locale}/backoffice/dashboard`, icon: LayoutDashboard },
    { name: 'Usuarios', href: `/${locale}/backoffice/users`, icon: Users },
    { name: 'Reservas', href: `/${locale}/backoffice/bookings`, icon: CalendarDays },
    { name: 'Servicios', href: `/${locale}/backoffice/services`, icon: Sparkles },
  ];

  const isActive = (href: string) => pathname.startsWith(href);
  const currentSection = navigation.find((n) => isActive(n.href))?.name || 'Visión general';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Apple Style */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/70 backdrop-blur-3xl border-r border-gray-200/50 flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 shadow-2xl lg:shadow-none`}
      >
        {/* Logo Area */}
        <div className="pt-8 pb-6 px-6">
          <Link href={`/${locale}/backoffice/dashboard`} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center shadow-md">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-gray-900 leading-none">NeoCore</p>
              <p className="text-[11px] font-medium text-gray-500 mt-1">Centro de Administración</p>
            </div>
          </Link>
          <button
            className="absolute top-6 right-4 lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-[18px] h-[18px] ${active ? 'text-white' : 'text-gray-400'}`} />
                  {item.name}
                </div>
                {active && <ChevronRight className="w-4 h-4 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 mt-auto border-t border-gray-200/50">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300/50 flex items-center justify-center text-gray-600 font-semibold shadow-sm">
              {user?.first_name?.[0] || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-gray-900 truncate">
                {user?.full_name || 'Administrador'}
              </p>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Topbar */}
        <header className="h-[60px] bg-white/70 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-[17px] font-semibold text-gray-900 tracking-tight">
              {currentSection}
            </h1>
          </div>
          <div className="flex items-center">
             {/* Optional top-right tools */}
             <div className="hidden sm:flex items-center gap-2 text-[12px] font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Sistema En Línea
             </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
