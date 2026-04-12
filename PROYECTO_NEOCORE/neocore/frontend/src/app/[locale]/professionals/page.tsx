'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { professionalsAPI, Professional } from '@/lib/api';
import { Briefcase, Star, Calendar, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const PROFESSIONAL_IMAGES: Record<string, string> = {
  medicina: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
  fisioterapia: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
  psicolog: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop',
  nutrición: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop',
  default: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
};

function getProfessionalImage(specialty: string): string {
  const n = specialty.toLowerCase();
  if (n.includes('medicina') || n.includes('médic')) return PROFESSIONAL_IMAGES.medicina;
  if (n.includes('fisioterapia') || n.includes('rehabilitación')) return PROFESSIONAL_IMAGES.fisioterapia;
  if (n.includes('psicolog')) return PROFESSIONAL_IMAGES.psicolog;
  if (n.includes('nutrición') || n.includes('nutricion')) return PROFESSIONAL_IMAGES.nutrición;
  return PROFESSIONAL_IMAGES.default;
}

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    try {
      const data = await professionalsAPI.list();
      setProfessionals(data);
    } catch (error) {
      console.error('Error loading professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfessionals = professionals.filter((prof) =>
    prof.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.specialty.toLowerCase().includes(searchTerm.toLowerCase())
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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 mb-6">
                <Sparkles className="w-4 h-4 text-[#5E5CE6]" />
                <span className="text-[12px] font-bold tracking-wide uppercase text-[#5E5CE6]">Talento Experto</span>
              </div>
              <h1 className="text-[44px] sm:text-[56px] font-extrabold text-gray-900 tracking-tight leading-tight mb-5">
                Nuestros Profesionales
              </h1>
              <p className="text-[19px] sm:text-[21px] text-gray-500 max-w-[600px] mx-auto font-medium">
                Conoce al equipo de especialistas certificados que cuidarán de ti.
              </p>
           </motion.div>
        </div>
      </section>

      {/* Search */}
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
              placeholder="Ej. Juan Pérez, Fisioterapia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent pl-14 pr-6 py-4 text-[16px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            />
          </div>
        </motion.div>
      </div>

      {/* Professionals Grid */}
      <div className="max-w-[1200px] mx-auto px-4 mt-16">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-gray-50 rounded-[28px] overflow-hidden animate-pulse border border-gray-100">
                <div className="h-[250px] bg-gray-200" />
                <div className="p-7 space-y-4">
                   <div className="h-6 bg-gray-200 rounded-full w-2/3 mx-auto" />
                   <div className="h-4 bg-gray-200 rounded-full w-1/2 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="text-center py-24 bg-white/60 backdrop-blur-xl rounded-[32px] border border-white shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-[20px] font-semibold text-gray-900 mb-2 tracking-tight">
              No se encontraron resultados
            </h3>
            <p className="text-[15px] font-medium text-gray-500">
              Prueba a cambiar el término de búsqueda por especialidad o nombre.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProfessionals.map((professional, index) => (
              <ProfessionalCard key={professional.id} professional={professional} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfessionalCard({ professional, index }: { professional: Professional, index: number }) {
  const imageSrc = professional.profile_image || getProfessionalImage(professional.specialty);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="bg-white/80 backdrop-blur-xl rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white overflow-hidden transition-all duration-300 group hover:-translate-y-1"
    >
      <div className="relative w-full h-[280px] overflow-hidden bg-gray-100">
        <Image
          src={imageSrc}
          alt={professional.full_name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-60" />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 text-[12px] font-bold tracking-wide uppercase text-gray-800">
           <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
           5.0
        </div>
      </div>
      <div className="p-7">
        <h3 className="text-[20px] font-bold text-gray-900 mb-1 tracking-tight">{professional.full_name}</h3>
        <div className="flex items-center gap-1.5 text-[14px] font-medium text-[#5E5CE6] mb-4">
          <Briefcase className="w-4 h-4" />
          <span>{professional.specialty}</span>
        </div>
        {professional.bio && (
          <p className="text-[14px] font-medium text-gray-500 mb-6 line-clamp-2 leading-relaxed">{professional.bio}</p>
        )}
        <Link href={`/es/professionals/${professional.id}`}>
          <Button className="w-full bg-gray-900 text-white rounded-[14px] h-12 text-[15px] font-semibold hover:bg-[#5E5CE6] transition-colors group">
            <Calendar className="w-4 h-4 mr-2" />
            Agendar Sesión
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
