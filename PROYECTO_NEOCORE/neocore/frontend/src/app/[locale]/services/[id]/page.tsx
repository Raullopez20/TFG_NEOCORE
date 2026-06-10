'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { servicesAPI, professionalsAPI, Service, Professional } from '@/lib/api';
import { getServiceImage, getProfessionalImage } from '@/lib/images';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Star,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessional, setSelectedProfessional] = useState<number | null>(null);

  useEffect(() => {
    loadServiceDetails();
  }, [serviceId]);

  const loadServiceDetails = async () => {
    try {
      const serviceData = await servicesAPI.get(Number(serviceId));
      setService(serviceData);

      // Cargar profesionales que ofrecen este servicio
      const profsData = await professionalsAPI.list();
      setProfessionals(profsData);
    } catch (error) {
      console.error('Error loading service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    if (!selectedProfessional) {
      alert('Por favor selecciona un profesional');
      return;
    }
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/es/login');
      return;
    }

    // Redirigir a página de booking con parámetros
    router.push(`/es/booking/new?service=${serviceId}&professional=${selectedProfessional}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando servicio...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Servicio no encontrado</h2>
          <Link href="/es/services">
            <Button className="bg-blue-600 hover:bg-blue-700">Volver a Servicios</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-blue-600 to-blue-800">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${service.image || getServiceImage(service.name)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-3xl text-white">
            <Link
              href="/es/services"
              className="inline-flex items-center text-white hover:text-blue-200 mb-4 group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Volver a Servicios
            </Link>
            <h1 className="text-5xl font-bold mb-4">{service.name}</h1>
            <p className="text-xl text-blue-100">{service.description}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Service Info */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Detalles del Servicio</h2>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duración</p>
                    <p className="font-semibold text-gray-900">{service.duration_minutes} min</p>
                  </div>
                </div>

                {service.price && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Precio</p>
                      <p className="font-semibold text-gray-900">€{service.price}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Profesionales</p>
                    <p className="font-semibold text-gray-900">
                      {service.available_professionals_count || professionals.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Descripción Completa</h3>
                <p className="text-gray-700 mb-4">{service.description}</p>

                <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">Beneficios</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Atención personalizada y profesional</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Equipamiento de última generación</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Seguimiento continuo de tu progreso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Resultados comprobados</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Professionals Section */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Selecciona un Profesional
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {professionals.map((prof) => (
                  <div
                    key={prof.id}
                    onClick={() => setSelectedProfessional(prof.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedProfessional === prof.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {prof.profile_image ? (
                          <img
                            src={prof.profile_image}
                            alt={prof.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{prof.full_name}</h3>
                        <p className="text-sm text-gray-600">{prof.specialty}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reservar Ahora</h3>

              {service.price && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Precio del servicio</p>
                  <p className="text-3xl font-bold text-blue-600">€{service.price}</p>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>{service.duration_minutes} minutos</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Disponible hoy</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>{professionals.length} profesionales disponibles</span>
                </div>
              </div>

              <Button
                onClick={handleBooking}
                disabled={!selectedProfessional}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Reservar Cita
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Al reservar aceptas nuestros términos y condiciones
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
