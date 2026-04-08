'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, Calendar, LogOut, LayoutDashboard, Home, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { authAPI, User as UserType } from '@/lib/api';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();

  const locale = pathname.split('/')[1] || 'es';

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
    { name: t('nav.home'), href: `/${locale}`, icon: Home },
    { name: t('nav.services'), href: `/${locale}/services`, icon: Calendar },
    { name: t('nav.professionals'), href: `/${locale}/professionals`, icon: User },
    { name: 'Sobre Nosotros', href: `/${locale}/about`, icon: Settings },
    { name: 'Contacto', href: `/${locale}/contact`, icon: Settings },
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
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-bold text-gray-900">NeoCore</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Auth Area - Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border py-2 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      href={`/${locale}/dashboard`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {t('nav.dashboard')}
                    </Link>
                    <Link
                      href={`/${locale}/profile`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      {t('nav.profile')}
                    </Link>
                    <Link
                      href={`/${locale}/bookings`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      {t('nav.bookings')}
                    </Link>
                    <div className="border-t my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('auth.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href={`/${locale}/login`}>
                  <Button variant="ghost" size="sm">
                    {t('auth.login')}
                  </Button>
                </Link>
                <Link href={`/${locale}/register`}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    {t('auth.register')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              {user ? (
                <>
                  <div className="px-4 py-2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                    </div>
                  </div>
                  <Link
                    href={`/${locale}/dashboard`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {t('nav.dashboard')}
                  </Link>
                  <Link
                    href={`/${locale}/profile`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <User className="w-4 h-4" />
                    {t('nav.profile')}
                  </Link>
                  <Link
                    href={`/${locale}/bookings`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <Calendar className="w-4 h-4" />
                    {t('nav.bookings')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('auth.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link href={`/${locale}/login`} onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">
                      {t('auth.login')}
                    </Button>
                  </Link>
                  <Link href={`/${locale}/register`} onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      {t('auth.register')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
