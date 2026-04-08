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
} from 'lucide-react';
import { authAPI, User } from '@/lib/api';

/**
 * Layout del backoffice (panel de administracion).
 *
 * - Sidebar oscuro fijo a la izquierda con navegacion principal.
 * - Header superior con breadcrumb sencillo y datos del admin.
 * - AdminGuard: redirige al login si el usuario no tiene rol ADMIN.
 * - Responsive: en moviles el sidebar se convierte en menu lateral
 *   abrible mediante un boton hamburguesa.
 */
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

  // Locale dinamico de la URL: /es/backoffice/... o /en/backoffice/...
  const locale = pathname.split('/')[1] || 'es';

  useEffect(() => {
    let mounted = true;

    const verifyAdmin = async () => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('access_token')
          : null;
      if (!token) {
        router.replace(`/${locale}/login`);
        return;
      }
      try {
        const me = await authAPI.me();
        if (!mounted) return;
        if (me.role !== 'ADMIN') {
          // Cualquier usuario no admin va al dashboard general
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
    return () => {
      mounted = false;
    };
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
    {
      name: 'Dashboard',
      href: `/${locale}/backoffice/dashboard`,
      icon: LayoutDashboard,
    },
    {
      name: 'Usuarios',
      href: `/${locale}/backoffice/users`,
      icon: Users,
    },
    {
      name: 'Reservas',
      href: `/${locale}/backoffice/bookings`,
      icon: CalendarDays,
    },
    {
      name: 'Servicios',
      href: `/${locale}/backoffice/services`,
      icon: Sparkles,
    },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  // Migas de pan: ultimo segmento de la URL como titulo de seccion
  const currentSection =
    navigation.find((n) => isActive(n.href))?.name || 'Backoffice';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1622] flex items-center justify-center">
        <div className="text-center text-slate-200">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-blue-400" />
          <p className="text-sm tracking-wide">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Overlay movil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar oscuro */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1e2a3a] text-slate-100 flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-700/60">
          <Link
            href={`/${locale}/backoffice/dashboard`}
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">NeoCore</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                Backoffice
              </p>
            </div>
          </Link>
          <button
            className="lg:hidden p-1 rounded hover:bg-slate-700/50"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegacion principal */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Perfil + logout */}
        <div className="border-t border-slate-700/60 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-200 font-semibold">
              {user?.first_name?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.full_name || user?.email}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-slate-700/60 hover:bg-slate-700 text-slate-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Area principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">
                Backoffice
              </p>
              <h1 className="text-base font-semibold text-slate-800 leading-tight">
                {currentSection}
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Sistema operativo
            </span>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
