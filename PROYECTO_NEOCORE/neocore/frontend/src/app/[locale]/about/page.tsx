'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Target, Heart, Shield, ShieldCheck } from 'lucide-react';

const CONTACT = {
  phone: '+34 910 555 730',
  email: 'info@neocoree.xyz',
  address: 'Calle de la Salud, 28 · 28013 Madrid',
};

export default function AboutPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';

  const values = [
    {
      icon: Heart,
      title: 'Compromiso con la Salud',
      description: 'Nos dedicamos a proporcionar servicios de salud y bienestar de la más alta calidad.',
    },
    {
      icon: Users,
      title: 'Equipo Profesional',
      description: 'Contamos con profesionales certificados y con años de experiencia en cada especialidad.',
    },
    {
      icon: Target,
      title: 'Enfoque Personalizado',
      description: 'Cada paciente recibe un tratamiento único adaptado a sus necesidades específicas.',
    },
    {
      icon: Shield,
      title: 'Seguridad y Confianza',
      description: 'Cumplimos con los más altos estándares de seguridad y protección de datos.',
    },
  ];

  const stats = [
    { value: '18', label: 'Profesionales certificados' },
    { value: '21', label: 'Servicios especializados' },
    { value: '220+', label: 'Pacientes atendidos' },
    { value: '4,9/5', label: 'Valoración media' },
  ];

  const team = [
    {
      name: 'Dra. Sofía González Herrera',
      role: 'Directora Médica',
      specialty: 'Medicina General',
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop&q=80&auto=format',
    },
    {
      name: 'María García Ruiz',
      role: 'Coordinadora de Fisioterapia',
      specialty: 'Fisioterapia',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&q=80&auto=format',
    },
    {
      name: 'Dr. Carlos Rodríguez Blanco',
      role: 'Responsable de Psicología',
      specialty: 'Psicología Deportiva',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80&auto=format',
    },
    {
      name: 'Juan López Sánchez',
      role: 'Responsable de Nutrición',
      specialty: 'Nutrición y Dietética',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&q=80&auto=format',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative min-h-[380px] md:h-[500px] bg-gradient-to-br from-blue-600 to-blue-800 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&h=500&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative container mx-auto px-4 h-full flex items-center py-16 md:py-0">
          <div className="max-w-3xl text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Transformando la Salud y el Bienestar
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Somos un centro de salud y bienestar con un equipo multidisciplinar de 18
              profesionales certificados, dedicado a ofrecer una atención cercana,
              personalizada y basada en la evidencia.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 -mt-8 md:-mt-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-xl p-6 text-center hover:shadow-2xl transition-shadow"
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Nuestra Misión</h2>
            <p className="text-lg text-gray-700 mb-4">
              En NeoCore, nuestra misión es proporcionar servicios de salud excepcionales que
              mejoren la calidad de vida de nuestros pacientes. Nos comprometemos a ofrecer
              atención personalizada, utilizando las últimas tecnologías y metodologías.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Creemos que cada persona merece acceso a servicios de salud de calidad,
              por eso trabajamos incansablemente para hacer que la atención médica sea
              accesible, conveniente y efectiva.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center shrink-0">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Protección de datos garantizada</p>
                <p className="text-gray-600">Cumplimiento RGPD y cifrado de datos sensibles</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop"
                alt="Equipo médico"
                className="w-full h-auto"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl opacity-20" />
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl opacity-20" />
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Nuestros Valores</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Los pilares que guían nuestro trabajo diario y nuestro compromiso con la excelencia
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center hover:shadow-lg hover:border-blue-100 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-blue-600 transition-colors">
                    <Icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Nuestro Equipo</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Profesionales dedicados y apasionados por tu bienestar
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {team.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-32 h-32 mx-auto mb-5 rounded-full overflow-hidden ring-4 ring-blue-50">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-lg font-bold text-gray-900 leading-snug mb-1">{member.name}</h3>
              <p className="text-blue-600 font-medium text-sm mb-1">{member.role}</p>
              <p className="text-gray-500 text-sm">{member.specialty}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href={`/${locale}/professionals`}
            className="inline-block text-blue-600 font-semibold hover:text-blue-800 transition-colors"
          >
            Conoce a todo el equipo →
          </Link>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            ¿Listo para comenzar tu viaje hacia el bienestar?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Estamos en {CONTACT.address}. Escríbenos a {CONTACT.email} o llámanos al {CONTACT.phone}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/services`}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Ver Servicios
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-white"
            >
              Contactar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
