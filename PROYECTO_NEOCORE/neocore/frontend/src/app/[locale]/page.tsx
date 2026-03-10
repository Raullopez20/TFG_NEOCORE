'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, Users, Shield, Sparkles, Heart, Star, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&h=1080&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Tu Salud y Bienestar,
              <span className="text-blue-200"> Nuestra Prioridad</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Servicios médicos profesionales con los mejores especialistas. 
              Reserva tu cita en segundos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/es/services">
                <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-semibold">
                  Explorar Servicios
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/es/about">
                <Button className="bg-blue-700 text-white hover:bg-blue-800 border-2 border-white px-8 py-6 text-lg font-semibold">
                  Conocer Más
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Por qué Elegir NeoCore?
            </h2>
            <p className="text-xl text-gray-600">
              Servicios de calidad con atención personalizada
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Calendar className="w-12 h-12 text-blue-600" />}
              title="Reserva Fácil"
              description="Sistema de reservas intuitivo y rápido para todas nuestras especialidades."
            />
            <FeatureCard
              icon={<Users className="w-12 h-12 text-blue-600" />}
              title="Profesionales Expertos"
              description="Equipo multidisciplinar de profesionales certificados y con experiencia."
            />
            <FeatureCard
              icon={<Shield className="w-12 h-12 text-blue-600" />}
              title="Seguro y Confiable"
              description="Tus datos están protegidos con los más altos estándares de seguridad."
            />
            <FeatureCard
              icon={<Sparkles className="w-12 h-12 text-blue-600" />}
              title="Atención Personalizada"
              description="Cada tratamiento adaptado a tus necesidades y objetivos específicos."
            />
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestras Especialidades</h2>
            <p className="text-xl text-gray-600 mb-8">
              Servicios profesionales para tu salud integral
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SpecialtyCard
              title="Fisioterapia"
              description="Rehabilitación y tratamiento de lesiones"
              image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop"
            />
            <SpecialtyCard
              title="Nutrición"
              description="Planes alimenticios personalizados"
              image="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop"
            />
            <SpecialtyCard
              title="Entrenamiento"
              description="Programas de ejercicio a medida"
              image="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop"
            />
            <SpecialtyCard
              title="Bienestar Mental"
              description="Apoyo psicológico y emocional"
              image="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop"
            />
          </div>

          <div className="text-center mt-12">
            <Link href="/es/services">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                Ver Todos los Servicios
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-blue-600 mb-2">10,000+</div>
              <p className="text-gray-600 text-lg">Pacientes Atendidos</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-blue-600 mb-2">50+</div>
              <p className="text-gray-600 text-lg">Profesionales</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-blue-600 mb-2">15</div>
              <p className="text-gray-600 text-lg">Años de Experiencia</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-blue-600 mb-2">98%</div>
              <p className="text-gray-600 text-lg">Satisfacción</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1920&h=400&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Comienza Tu Viaje Hacia el Bienestar
          </h2>
          <p className="text-xl mb-10 text-blue-100 max-w-2xl mx-auto">
            Únete a miles de personas que ya confían en nosotros para cuidar de su salud
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/es/register">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold">
                Crear Cuenta Gratis
              </Button>
            </Link>
            <Link href="/es/contact">
              <Button className="bg-blue-700 text-white hover:bg-blue-800 border-2 border-white px-8 py-4 text-lg font-semibold">
                Contactar
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function SpecialtyCard({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}
