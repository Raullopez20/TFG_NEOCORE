'use client';

import { Users, Target, Award, Heart, TrendingUp, Shield } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Compromiso con la Salud',
      description: 'Nos dedicamos a proporcionar servicios de salud y bienestar de la más alta calidad.',
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: Users,
      title: 'Equipo Profesional',
      description: 'Contamos con los mejores profesionales certificados y con años de experiencia.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Target,
      title: 'Enfoque Personalizado',
      description: 'Cada paciente recibe un tratamiento único adaptado a sus necesidades específicas.',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: Shield,
      title: 'Seguridad y Confianza',
      description: 'Cumplimos con los más altos estándares de seguridad y protección de datos.',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Pacientes Satisfechos' },
    { value: '50+', label: 'Profesionales Certificados' },
    { value: '15', label: 'Años de Experiencia' },
    { value: '98%', label: 'Tasa de Satisfacción' },
  ];

  const team = [
    {
      name: 'Dra. María González',
      role: 'Directora Médica',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
      specialty: 'Medicina General',
    },
    {
      name: 'Dr. Carlos Ramírez',
      role: 'Especialista Senior',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
      specialty: 'Fisioterapia',
    },
    {
      name: 'Dra. Ana Martínez',
      role: 'Coordinadora',
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop',
      specialty: 'Psicología',
    },
    {
      name: 'Dr. Javier López',
      role: 'Especialista',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop',
      specialty: 'Nutrición',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[500px] bg-gradient-to-br from-blue-600 to-blue-800 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&h=500&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-3xl text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Transformando la Salud y el Bienestar
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Somos líderes en proporcionar servicios de salud integrales y personalizados, 
              con más de 15 años de experiencia cuidando de nuestros pacientes.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 -mt-16">
        <div className="grid md:grid-cols-4 gap-6 mb-16">
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
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Certificación Internacional</p>
                <p className="text-gray-600">ISO 9001:2015 en Calidad de Servicios</p>
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
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl opacity-20" />
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl opacity-20" />
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
                  className="bg-gray-50 rounded-xl p-6 hover:shadow-xl transition-all duration-300 group"
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${value.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <p className="text-sm text-blue-300">{member.specialty}</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-medium">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            ¿Listo para comenzar tu viaje hacia el bienestar?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Únete a miles de personas que ya confían en nosotros para cuidar de su salud
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/es/services"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Ver Servicios
            </a>
            <a
              href="/es/contact"
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-white"
            >
              Contactar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
