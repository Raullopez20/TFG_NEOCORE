'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { servicesAPI, Service } from '@/lib/api';
import { Clock, Users, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UNSPLASH = {
  fisioterapia: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop',
  entrenamiento: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop',
  masaje: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=400&fit=crop',
  psicologia: 'https://images.unsplash.com/photo-1527137342181-19aab11a8ee8?w=800&h=400&fit=crop',
  nutricion: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=400&fit=crop',
  medicina: 'https://images.unsplash.com/photo-1535916707207-35f97e715e1b?w=800&h=400&fit=crop',
  bienestar: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=400&fit=crop',
  default: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop',
};

function getServiceImage(name: string): string {
  const normalized = name.toLowerCase();

  if (normalized.includes('fisioterapia') || normalized.includes('rehabilitación')) {
    return UNSPLASH.fisioterapia;
  }
  if (normalized.includes('entrenamiento') || normalized.includes('personal') || normalized.includes('fitness')) {
    return UNSPLASH.entrenamiento;
  }
  if (normalized.includes('masaje') || normalized.includes('deportivo')) {
    return UNSPLASH.masaje;
  }
  if (normalized.includes('psicolog') || normalized.includes('terapia') || normalized.includes('emocional')) {
    return UNSPLASH.psicologia;
  }
  if (normalized.includes('nutric') || normalized.includes('alimentación')) {
    return UNSPLASH.nutricion;
  }
  if (normalized.includes('medicina') || normalized.includes('general') || normalized.includes('consulta')) {
    return UNSPLASH.medicina;
  }
  if (normalized.includes('bienestar') || normalized.includes('spa') || normalized.includes('relajación')) {
    return UNSPLASH.bienestar;
  }
  return UNSPLASH.default;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await servicesAPI.list();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="gradient-hero py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-5xl font-bold text-white mb-4">
              Nuestros Servicios
            </h1>
            <p className="text-lg text-gray-400">
              Descubre nuestra amplia gama de servicios profesionales de salud y bienestar
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search Bar */}
      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-apple-lg p-4 mb-10 max-w-2xl mx-auto"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium w-full pl-12 pr-4 py-3"
            />
          </div>
        </motion.div>
      </div>

      {/* Services Grid */}
      <div className="container mx-auto px-4 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-apple overflow-hidden animate-pulse">
                <div className="h-56 bg-gray-200" />
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
                  <div className="h-4 bg-gray-100 rounded-lg w-full" />
                  <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
                  <div className="flex gap-4 pt-2">
                    <div className="h-4 bg-gray-100 rounded-lg w-20" />
                    <div className="h-4 bg-gray-100 rounded-lg w-28" />
                  </div>
                  <div className="h-11 bg-gray-200 rounded-xl w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Search className="w-9 h-9 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron servicios
            </h3>
            <p className="text-gray-500">
              Intenta con otro término de búsqueda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service, index) => (
              <ServiceCard key={service.id} service={service} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="bg-white rounded-2xl overflow-hidden shadow-apple hover-lift group"
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <Image
          src={service.image || getServiceImage(service.name)}
          alt={service.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {service.price && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg">
            <span className="text-lg font-bold text-gray-900">{service.price}€</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
        <p className="text-gray-500 mb-4 line-clamp-2 text-sm leading-relaxed">{service.description}</p>

        {/* Meta Info */}
        <div className="flex items-center gap-4 mb-5 text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{service.duration_minutes} min</span>
          </div>
          {service.available_professionals_count > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{service.available_professionals_count} profesionales</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link href={`/es/services/${service.id}`}>
          <Button className="w-full bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors">
            Ver Detalles
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
