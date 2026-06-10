'use client';

import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Heart, Calendar, Shield, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  if (pathname.includes('/backoffice')) return null;

  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Franja superior destacada */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-white text-xl font-bold mb-1">¿Listo para tu primera cita?</h3>
            <p className="text-blue-200 text-sm">Reserva en minutos, sin esperas, sin llamadas.</p>
          </div>
          <Link href="/es/booking/new"
            className="shrink-0 px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-md text-sm">
            Reservar ahora →
          </Link>
        </div>
      </div>

      {/* Cuerpo principal */}
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Marca */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image src="/logo.png" alt="NeoCore" width={36} height={36} className="w-9 h-9" />
              <div>
                <p className="text-white font-black text-lg leading-none">NeoCore</p>
                <p className="text-blue-400 text-[10px] uppercase tracking-widest">Salud &amp; Bienestar</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              Sistema integral de reservas para centros de salud y bienestar. Conectamos profesionales con pacientes de forma sencilla y eficiente.
            </p>
            {/* Beneficios rápidos */}
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-blue-400" /> 100% seguro y privado</li>
              <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-blue-400" /> Reserva 24/7</li>
              <li className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-blue-400" /> Confirmación inmediata</li>
            </ul>
          </div>

          {/* Navegación */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wide">Navegación</h3>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/es', label: 'Inicio' },
                { href: '/es/services', label: 'Servicios' },
                { href: '/es/professionals', label: 'Profesionales' },
                { href: '/es/booking/new', label: 'Reservar cita' },
                { href: '/es/about', label: 'Sobre nosotros' },
                { href: '/es/contact', label: 'Contacto' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white hover:translate-x-0.5 transition-all inline-block">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Área de clientes */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wide">Mi cuenta</h3>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/es/login', label: 'Iniciar sesión' },
                { href: '/es/register', label: 'Crear cuenta gratis' },
                { href: '/es/bookings', label: 'Mis reservas' },
                { href: '/es/profile', label: 'Mi perfil' },
                { href: '/es/forgot-password', label: 'Recuperar contraseña' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white hover:translate-x-0.5 transition-all inline-block">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto + Redes */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wide">Contacto</h3>
            <ul className="space-y-3 text-sm mb-6">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="tel:+34910555730" className="hover:text-white transition-colors">+34 910 555 730</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="mailto:info@neocoree.xyz" className="hover:text-white transition-colors">info@neocoree.xyz</a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Calle de la Salud, 28 · 28013 Madrid</span>
              </li>
            </ul>

            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Síguenos</h3>
            <div className="flex gap-2">
              {[
                { icon: Facebook, label: 'Facebook', color: 'hover:bg-blue-600' },
                { icon: Twitter, label: 'Twitter / X', color: 'hover:bg-slate-600' },
                { icon: Instagram, label: 'Instagram', color: 'hover:bg-pink-600' },
              ].map(({ icon: Icon, label, color }) => (
                <a key={label} href="#" aria-label={label}
                  className={`w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center ${color} transition-colors`}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-slate-800 py-6">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>&copy; {year} NeoCore. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Hecho con <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" /> para la salud y el bienestar
          </p>
          <div className="flex gap-4">
            <Link href="/es/privacy" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/es/terms" className="hover:text-white transition-colors">Términos</Link>
            <Link href="/es/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
