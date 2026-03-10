'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { professionalsAPI, Professional } from '@/lib/api';
import { User, Briefcase, Star, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Nuestros Profesionales</h1>
            <p className="text-xl text-indigo-100">
              Equipo de expertos certificados con años de experiencia
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Professionals Grid */}
      <div className="container mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron profesionales
            </h3>
            <p className="text-gray-600">Intenta con otro término de búsqueda</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProfessionals.map((professional) => (
              <ProfessionalCard key={professional.id} professional={professional} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfessionalCard({ professional }: { professional: Professional }) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 group">
      {/* Avatar */}
      <div className="relative mb-4">
        <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
          {professional.profile_image ? (
            <img
              src={professional.profile_image}
              alt={professional.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-white" />
          )}
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
      </div>

      {/* Info */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {professional.full_name}
        </h3>
        <div className="flex items-center justify-center gap-1 text-sm text-indigo-600">
          <Briefcase className="w-4 h-4" />
          <span>{professional.specialty}</span>
        </div>
      </div>

      {/* Bio */}
      {professional.bio && (
        <p className="text-sm text-gray-600 text-center mb-4 line-clamp-3">
          {professional.bio}
        </p>
      )}

      {/* Rating */}
      <div className="flex items-center justify-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        <span className="text-sm text-gray-600 ml-1">(4.9)</span>
      </div>

      {/* CTA */}
      <Link href={`/es/professionals/${professional.id}`}>
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 group-hover:shadow-lg transition-all">
          <Calendar className="w-4 h-4 mr-2" />
          Agendar Cita
        </Button>
      </Link>
    </div>
  );
}
