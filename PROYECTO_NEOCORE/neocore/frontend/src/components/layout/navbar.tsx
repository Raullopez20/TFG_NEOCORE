'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, Calendar, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { authAPI, User as UserType } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();

  const locale = pathname.split('/')[1] || 'es';

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authAPI.me().then(setUser).catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      });
    } else {
      setUser(null);
    }
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    setUser(null);
    setDropdownOpen(false);
    setIsOpen(false);
    router.push(`/${locale}/login`);
  };

  const navigation = [
    { name: t('nav.home'), href: `/${locale}` },
    { name: t('nav.services'), href: `/${locale}/services` },
    { name: t('nav.professionals'), href: `/${locale}/professionals` },
    { name: 'Sobre Nosotros', href: `/${locale}/about` },
    { name: 'Contacto', href: `/${locale}/contact` },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Ocultar navbar publica en el backoffice (tiene su propio layout admin)
  if (pathname.includes('/backoffice')) {
    return null;
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'PROFESSIONAL': return 'Profesional';
      default: return 'Cliente';
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-1.5 group">
            <span className="text-xl font-semibold tracking-tight text-gray-900">
              Neo
            </span>
            <span className="text-xl font-semibold tracking-tight text-gray-900">
              Core
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-3 group-hover:scale-125 transition-transform" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-4 py-2 text-[13px] font-medium transition-colors"
              >
                <span
                  className={
                    isActive(item.href)
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }
                >
                  {item.name}
                </span>
                {isActive(item.href) && (
                  <motion.span
                    layoutId="navbar-active"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-blue-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Auth Area - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                    dropdownOpen
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-100/70'
                  }`}
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                    <span className="text-white text-[11px] font-semibold leading-none">
                      {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-[13px] font-medium text-gray-900 leading-tight">
                      {user.first_name}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute right-0 mt-2 w-60 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/[0.08] border border-gray-200/60 py-1.5 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                        <span className="inline-block mt-1.5 text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {getRoleLabel(user.role)}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          href={`/${locale}/dashboard`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-400" />
                          {t('nav.dashboard')}
                        </Link>
                        <Link
                          href={`/${locale}/profile`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          {t('nav.profile')}
                        </Link>
                        <Link
                          href={`/${locale}/bookings`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {t('nav.bookings')}
                        </Link>
                      </div>

                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50/60 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('auth.logout')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={`/${locale}/login`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-full px-4"
                  >
                    {t('auth.login')}
                  </Button>
                </Link>
                <Link href={`/${locale}/register`}>
                  <Button
                    size="sm"
                    className="text-[13px] font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-full px-4 shadow-sm"
                  >
                    {t('auth.register')}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100/70 transition-colors"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-5 h-5 text-gray-700" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="w-5 h-5 text-gray-700" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Navigation - Full screen overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-16 z-40 md:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex flex-col h-full overflow-y-auto">
                {/* Nav links */}
                <div className="px-4 pt-6 pb-4 space-y-1">
                  {navigation.map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`block px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                          isActive(item.href)
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Separator */}
                <div className="mx-6 border-t border-gray-100" />

                {/* Auth section */}
                <div className="px-4 pt-4 pb-8 space-y-2">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                          <span className="text-white text-sm font-semibold">
                            {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                        </div>
                      </div>

                      <Link
                        href={`/${locale}/dashboard`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        {t('nav.dashboard')}
                      </Link>
                      <Link
                        href={`/${locale}/profile`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        {t('nav.profile')}
                      </Link>
                      <Link
                        href={`/${locale}/bookings`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {t('nav.bookings')}
                      </Link>

                      <div className="pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[15px] text-red-600 hover:bg-red-50/60 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('auth.logout')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3 px-2">
                      <Link href={`/${locale}/login`} onClick={() => setIsOpen(false)}>
                        <Button
                          variant="outline"
                          className="w-full rounded-xl h-11 text-[15px] font-medium border-gray-200"
                        >
                          {t('auth.login')}
                        </Button>
                      </Link>
                      <Link href={`/${locale}/register`} onClick={() => setIsOpen(false)}>
                        <Button className="w-full rounded-xl h-11 text-[15px] font-medium bg-gray-900 hover:bg-gray-800 text-white">
                          {t('auth.register')}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
