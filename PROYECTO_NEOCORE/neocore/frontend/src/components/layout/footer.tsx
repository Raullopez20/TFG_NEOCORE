'use client';

import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  if (pathname.includes('/backoffice')) {
    return null;
  }

  return (
    <footer className="relative bg-gradient-to-b from-slate-950 to-slate-900 text-slate-400">
      {/* Subtle top border gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      <div className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                <span className="text-sm font-semibold text-white">N</span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">
                NeoCore
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-slate-500">
              Sistema integral de reservas para centro de salud y bienestar.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-5 text-xs font-medium uppercase tracking-widest text-slate-500">
              Enlaces
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/es/services"
                  className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                >
                  Servicios
                </Link>
              </li>
              <li>
                <Link
                  href="/es/professionals"
                  className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                >
                  Profesionales
                </Link>
              </li>
              <li>
                <Link
                  href="/es/about"
                  className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                >
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/es/contact"
                  className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-xs font-medium uppercase tracking-widest text-slate-500">
              Contacto
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                <span>+34 123 456 789</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <span>info@neocore.com</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>Madrid, Espana</span>
              </li>
            </ul>
          </div>

          {/* Legal & Social */}
          <div>
            <h3 className="mb-5 text-xs font-medium uppercase tracking-widest text-slate-500">
              Legal
            </h3>
            <ul className="mb-6 space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                >
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                >
                  Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                >
                  Cookies
                </Link>
              </li>
            </ul>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 text-slate-500 transition-all duration-200 hover:border-slate-600 hover:text-white"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 text-slate-500 transition-all duration-200 hover:border-slate-600 hover:text-white"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 text-slate-500 transition-all duration-200 hover:border-slate-600 hover:text-white"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider + Copyright */}
        <div className="mt-14 border-t border-slate-800/60 pt-6">
          <p className="text-center text-xs text-slate-600">
            &copy; {currentYear} NeoCore. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
