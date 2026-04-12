'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { servicesAPI, Service } from '@/lib/api';
import { Clock, Users, ArrowRight, Search, Sparkles } from 'lucide-react';
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
      setServices(data.filter((s: Service) => s.is_active !== false));
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
    <div className="min-h-screen bg-[#f5f5f7] pb-24">
      {/* Hero Section */}
      <section className="bg-white/60 backdrop-blur-3xl pt-24 pb-32 border-b border-gray-200/50">
        <div className="max-w-[1200px] mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6">
              <Sparkles className="w-4 h-4 text-[#0071e3]" />
              <span className="text-[12px] font-bold tracking-wide uppercase text-[#0071e3]">Catálogo de Especialidades</span>
            </div>
            <h1 className="text-[44px] sm:text-[56px] font-extrabold text-gray-900 tracking-tight leading-tight mb-5">
              Nuestros Servicios
            </h1>
            <p className="text-[19px] sm:text-[21px] text-gray-500 max-w-[600px] mx-auto font-medium">
              Soluciones diseñadas por profesionales para llevar tu salud y bienestar al máximo nivel.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search Bar */}
      <div className="max-w-[800px] mx-auto px-4 -mt-9 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-2 border border-white"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-5 text-gray-400 w-[20px] h-[20px]" />
            <input
              type="text"
              placeholder="Ej. Fisioterapia, Masaje, Coaching..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent pl-14 pr-6 py-4 text-[16px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            />
          </div>
        </motion.div>
      </div>

      {/* Services Grid */}
      <div className="max-w-[1200px] mx-auto px-4 mt-16">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-50 rounded-[28px] overflow-hidden animate-pulse border border-gray-100">
                <div className="h-[240px] bg-gray-200" />
                <div className="p-7 space-y-4">
                   <div className="h-6 bg-gray-200 rounded-full w-2/3" />
                   <div className="h-4 bg-gray-200 rounded-full w-full" />
                   <div className="h-10 bg-gray-200 rounded-[12px] w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-24 bg-white/60 backdrop-blur-xl rounded-[32px] border border-white shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-[20px] font-semibold text-gray-900 mb-2 tracking-tight">
              No se encontraron servicios
            </h3>
            <p className="text-[15px] font-medium text-gray-500">
              Prueba a cambiar el término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="group bg-white/80 backdrop-blur-xl rounded-[28px] overflow-hidden border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-[240px] overflow-hidden bg-gray-100">
        <Image
          src={service.image || getServiceImage(service.name)}
          alt={service.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          unoptimized
        />
        {service.price && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg">
            <span className="text-[14px] font-bold text-gray-900">{service.price}€</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-7">
        <h3 className="text-[20px] font-bold text-gray-900 mb-3 tracking-tight leading-tight">{service.name}</h3>
        <p className="text-gray-500 mb-6 line-clamp-2 text-[14px] leading-relaxed font-medium">{service.description}</p>

        {/* Meta Info */}
        <div className="flex items-center gap-5 mb-6 text-[13px] text-gray-600 font-medium">
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-[10px] border border-gray-100">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{service.duration_minutes} min</span>
          </div>
          {service.available_professionals_count > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{service.available_professionals_count} prof.</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link href={`/es/services/${service.id}`}>
          <Button className="w-full bg-gray-900 text-white rounded-[14px] h-12 text-[15px] font-semibold hover:bg-[#0071e3] transition-colors">
            Ver Detalles
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
