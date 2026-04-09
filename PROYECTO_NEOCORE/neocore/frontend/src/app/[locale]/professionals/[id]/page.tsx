'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { professionalsAPI, reviewsAPI, Professional, Review } from '@/lib/api';
import {
  ArrowLeft,
  Mail,
  Award,
  Star,
  Calendar,
  MapPin,
  CheckCircle,
  Briefcase,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProfessionalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const professionalId = params.id as string;

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfessionalDetails();
  }, [professionalId]);

  const loadProfessionalDetails = async () => {
    try {
      // Cargamos en paralelo el detalle del profesional y sus resenas
      // visibles. Si fallan las resenas seguimos mostrando el perfil.
      const [data, reviewsData] = await Promise.all([
        professionalsAPI.get(Number(professionalId)),
        reviewsAPI.list({ professional: Number(professionalId) }).catch(() => []),
      ]);
      setProfessional(data);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading professional:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/es/login');
      return;
    }
    router.push(`/es/booking/new?professional=${professionalId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando profesional...</p>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profesional no encontrado</h2>
          <Link href="/es/professionals">
            <Button className="bg-blue-600 hover:bg-blue-700">Volver a Profesionales</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Cover */}
      <div className="relative h-80 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&h=400&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </div>

      <div className="container mx-auto px-4">
        {/* Profile Card */}
        <div className="relative -mt-32 mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <Link
              href="/es/professionals"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Volver a Profesionales
            </Link>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="relative">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg">
                  {professional.profile_image ? (
                    <img
                      src={professional.profile_image}
                      alt={professional.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Briefcase className="w-20 h-20 text-white" />
                  )}
                </div>
                <div className="absolute bottom-2 right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      {professional.full_name}
                    </h1>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-4 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                        {professional.specialty}
                      </span>
                      <span className="px-4 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Certificado
                      </span>
                    </div>
                    {/* Rating real calculado en backend (ProfessionalSerializer) */}
                    {professional.average_rating != null && professional.reviews_count ? (
                      <div className="flex items-center gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= Math.round(professional.average_rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-gray-600 ml-2">
                          ({professional.average_rating?.toFixed(1)}/5 ·{' '}
                          {professional.reviews_count}{' '}
                          {professional.reviews_count === 1 ? 'valoración' : 'valoraciones'})
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-4">
                        Aún no hay valoraciones publicadas.
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-lg text-gray-700 mb-6">{professional.bio}</p>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-500">Experiencia</p>
                      <p className="font-medium">10+ años</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-500">Pacientes</p>
                      <p className="font-medium">500+ atendidos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-500">Ubicación</p>
                      <p className="font-medium">Madrid, España</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-8 pb-16">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sobre Mí</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">
                  {professional.bio || 'Profesional dedicado con años de experiencia en el sector de la salud y el bienestar.'}
                </p>
                <p className="text-gray-700 mb-4">
                  Mi enfoque se centra en proporcionar atención personalizada y de calidad a cada uno de mis pacientes,
                  adaptando los tratamientos a sus necesidades específicas y objetivos individuales.
                </p>
                <p className="text-gray-700">
                  Comprometido con la formación continua y la excelencia profesional, utilizo las técnicas más
                  avanzadas y basadas en evidencia para garantizar los mejores resultados posibles.
                </p>
              </div>
            </div>

            {/* Specializations */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Especializaciones</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Rehabilitación Deportiva',
                  'Terapia Manual',
                  'Fisioterapia Neurológica',
                  'Masaje Terapéutico',
                  'Electroterapia',
                  'Ejercicio Terapéutico',
                ].map((spec, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{spec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Certificaciones y Formación</h2>
              <div className="space-y-4">
                {[
                  {
                    title: 'Licenciatura en Fisioterapia',
                    institution: 'Universidad Complutense de Madrid',
                    year: '2013',
                  },
                  {
                    title: 'Máster en Fisioterapia Deportiva',
                    institution: 'Universidad Europea de Madrid',
                    year: '2015',
                  },
                  {
                    title: 'Certificación en Terapia Manual',
                    institution: 'Instituto de Biomecánica',
                    year: '2018',
                  },
                ].map((cert, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{cert.title}</h3>
                      <p className="text-gray-600">{cert.institution}</p>
                      <p className="text-sm text-gray-500">{cert.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resenas reales de clientes (Review.is_visible=true) */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Opiniones de Clientes</h2>
                {reviews.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
                  </span>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">
                    Este profesional aún no tiene reseñas publicadas.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {reviews.slice(0, 5).map((review) => (
                    <article
                      key={review.id}
                      className="border border-gray-100 rounded-xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all"
                    >
                      <header className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {review.client_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {review.service_name} ·{' '}
                            {new Date(review.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </header>
                      {review.comment && (
                        <p className="text-gray-700 leading-relaxed text-sm">
                          {review.comment}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Reservar Cita</h3>
                <Button
                  onClick={handleBooking}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-lg font-semibold"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Agendar Ahora
                </Button>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Horarios Disponibles</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Lunes - Viernes</span>
                    <span className="font-medium">9:00 - 20:00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sábado</span>
                    <span className="font-medium">10:00 - 14:00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Domingo</span>
                    <span className="font-medium text-red-600">Cerrado</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Contacto</h4>
                <div className="space-y-2">
                  <a
                    href={`mailto:${professional.full_name.toLowerCase().replace(' ', '.')}@neocore.com`}
                    className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Enviar mensaje</span>
                  </a>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Primera consulta gratuita</strong> para nuevos pacientes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
