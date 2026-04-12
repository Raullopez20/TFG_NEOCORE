'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Users, Shield, Sparkles, Star, Quote } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  servicesAPI,
  professionalsAPI,
  reviewsAPI,
  Service,
  Professional,
  Review,
} from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Fallback images for services without a custom image                */
/* ------------------------------------------------------------------ */
const FALLBACK_SERVICE_IMAGES: Record<string, string> = {
  fisio: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
  nutri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop',
  entrena: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
  psic: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
  default: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=300&fit=crop',
};

function pickServiceImage(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, url] of Object.entries(FALLBACK_SERVICE_IMAGES)) {
    if (key !== 'default' && lower.includes(key)) return url;
  }
  return FALLBACK_SERVICE_IMAGES.default;
}

/* ------------------------------------------------------------------ */
/*  Reusable animation variants                                        */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                              */
/* ------------------------------------------------------------------ */
function useCountUp(target: number, inView: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.floor(eased * target);
      setCount(start);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);
  return count;
}

/* ================================================================== */
/*  Page component                                                     */
/* ================================================================== */
export default function HomePage() {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [professionalsCount, setProfessionalsCount] = useState<number | null>(null);
  const [testimonials, setTestimonials] = useState<Review[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  /* Section refs for scroll-triggered animations */
  const featuresRef = useRef(null);
  const servicesRef = useRef(null);
  const statsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);

  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });
  const servicesInView = useInView(servicesRef, { once: true, amount: 0.15 });
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });
  const testimonialsInView = useInView(testimonialsRef, { once: true, amount: 0.15 });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.3 });

  /* Animated stat counters */
  const countPatients = useCountUp(10000, statsInView);
  const countProfessionals = useCountUp(professionalsCount ?? 0, statsInView);
  const countYears = useCountUp(15, statsInView);
  const countSatisfaction = useCountUp(98, statsInView);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [services, professionals, reviews] = await Promise.all([
          servicesAPI.list().catch(() => [] as Service[]),
          professionalsAPI.list().catch(() => [] as Professional[]),
          reviewsAPI.list().catch(() => [] as Review[]),
        ]);
        if (cancelled) return;
        setFeaturedServices(services.filter((s) => s.is_active !== false).slice(0, 4));
        setProfessionalsCount(professionals.length);
        setTestimonials(
          reviews
            .filter((r) => r.rating >= 4 && r.comment && r.comment.trim().length > 0)
            .slice(0, 6)
        );
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ============================================================ */}
      {/*  HERO                                                         */}
      {/* ============================================================ */}
      <section className="relative min-h-screen flex items-center justify-center gradient-hero text-white overflow-hidden">
        {/* Floating gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="uppercase tracking-[0.3em] text-sm text-blue-300/80 font-medium"
            >
              NeoCore Health
            </motion.p>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.95]"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400">
                Tu Bienestar,
              </span>
              <br />
              <span className="text-white">Reimaginado</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              Servicios de salud de nueva generacion. Profesionales de elite,
              tecnologia de vanguardia y una experiencia sin fricciones.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <Link href="/es/services">
                <Button className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-full shadow-lg shadow-white/10 transition-all duration-300 hover:shadow-white/20 hover:scale-[1.02]">
                  Explorar Servicios
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/es/about">
                <Button className="bg-transparent text-white hover:bg-white/10 border border-white/30 px-8 py-6 text-lg font-semibold rounded-full transition-all duration-300 hover:border-white/60">
                  Conocer Mas
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ============================================================ */}
      {/*  FEATURES                                                     */}
      {/* ============================================================ */}
      <section ref={featuresRef} className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="uppercase tracking-[0.2em] text-sm font-semibold text-blue-600 mb-4 block">
              Por que NeoCore
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Disenado para tu salud
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Calendar,
                title: 'Reserva Facil',
                description: 'Sistema de reservas intuitivo y rapido para todas nuestras especialidades.',
              },
              {
                icon: Users,
                title: 'Profesionales Expertos',
                description: 'Equipo multidisciplinar de profesionales certificados y con experiencia.',
              },
              {
                icon: Shield,
                title: 'Seguro y Confiable',
                description: 'Tus datos estan protegidos con los mas altos estandares de seguridad.',
              },
              {
                icon: Sparkles,
                title: 'Atencion Personalizada',
                description: 'Cada tratamiento adaptado a tus necesidades y objetivos especificos.',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate={featuresInView ? 'visible' : 'hidden'}
                className="group bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors duration-300">
                  <feature.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SERVICES PREVIEW                                             */}
      {/* ============================================================ */}
      <section ref={servicesRef} className="py-24 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="uppercase tracking-[0.2em] text-sm font-semibold text-blue-600 mb-4 block">
              Nuestras Especialidades
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
              Servicios profesionales
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Soluciones integrales para tu salud y bienestar
            </p>
          </motion.div>

          {dataLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-gray-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredServices.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredServices.map((svc, i) => (
                <motion.div
                  key={svc.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate={servicesInView ? 'visible' : 'hidden'}
                >
                  <Link href={`/es/services/${svc.id}`}>
                    <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={svc.image || pickServiceImage(svc.name)}
                          alt={svc.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                        <h3 className="absolute bottom-4 left-4 right-4 text-lg font-bold text-white">
                          {svc.name}
                        </h3>
                      </div>
                      <div className="p-5">
                        <p className="text-gray-500 text-sm leading-relaxed">
                          {svc.description?.slice(0, 90) +
                            ((svc.description?.length || 0) > 90 ? '...' : '')}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Pronto anadiremos nuestros servicios. Vuelve en unos dias.
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-14"
          >
            <Link href="/es/services">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-[1.02]">
                Ver Todos los Servicios
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STATS                                                        */}
      {/* ============================================================ */}
      <section ref={statsRef} className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: countPatients, suffix: '+', label: 'Pacientes Atendidos', format: true },
              {
                value: professionalsCount !== null ? countProfessionals : null,
                suffix: '+',
                label: 'Profesionales',
                format: false,
              },
              { value: countYears, suffix: '', label: 'Anos de Experiencia', format: false },
              { value: countSatisfaction, suffix: '%', label: 'Satisfaccion', format: false },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate={statsInView ? 'visible' : 'hidden'}
              >
                <div className="text-5xl md:text-6xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  {stat.value !== null
                    ? `${stat.format ? stat.value.toLocaleString('es-ES') : stat.value}${stat.suffix}`
                    : '\u2014'}
                </div>
                <p className="text-gray-500 text-lg">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TESTIMONIALS                                                 */}
      {/* ============================================================ */}
      {testimonials.length > 0 && (
        <section ref={testimonialsRef} className="py-24 bg-gray-50/50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <span className="uppercase tracking-[0.2em] text-sm font-semibold text-blue-600 mb-4 block">
                Testimonios
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-3">
                Historias reales, resultados reales
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Opiniones de personas que ya confian en nuestro equipo.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((review, i) => (
                <motion.article
                  key={review.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate={testimonialsInView ? 'visible' : 'hidden'}
                  className="bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300"
                >
                  <Quote className="w-8 h-8 text-blue-200 mb-4" />
                  <p className="text-gray-600 leading-relaxed mb-6 text-[15px]">
                    {review.comment}
                  </p>
                  <div className="flex items-center gap-0.5 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-semibold text-gray-900 text-sm">
                      {review.client_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {review.service_name} &middot; con {review.professional_name}
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/*  CTA                                                          */}
      {/* ============================================================ */}
      <section ref={ctaRef} className="relative py-32 gradient-hero text-white overflow-hidden">
        {/* Floating gradient orbs */}
        <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 -right-20 w-[350px] h-[350px] rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 text-center max-w-3xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={ctaInView ? 'visible' : 'hidden'}
            className="space-y-8"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-4xl md:text-6xl font-bold tracking-tight leading-tight"
            >
              Comienza Tu Viaje Hacia{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                el Bienestar
              </span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              Unete a miles de personas que ya confian en nosotros para cuidar de su salud.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <Link href="/es/register">
                <Button className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-full shadow-lg shadow-white/10 transition-all duration-300 hover:shadow-white/20 hover:scale-[1.02]">
                  Crear Cuenta Gratis
                </Button>
              </Link>
              <Link href="/es/contact">
                <Button className="bg-transparent text-white hover:bg-white/10 border border-white/30 px-8 py-6 text-lg font-semibold rounded-full transition-all duration-300 hover:border-white/60">
                  Contactar
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
