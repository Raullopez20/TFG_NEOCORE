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
const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const staggerContainer: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
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
  const servicesInView = useInView(servicesRef, { once: true, amount: 0.2 });
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
            .slice(0, 3)
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
    <div className="min-h-screen overflow-x-hidden bg-[#f5f5f7]">
      {/* ============================================================ */}
      {/*  HERO                                                         */}
      {/* ============================================================ */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gray-50 text-gray-900 overflow-hidden">
        {/* Floating gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full bg-blue-300/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-300/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 text-center max-w-[900px] mt-16">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 cursor-default backdrop-blur-md border border-gray-200/50 shadow-sm mx-auto">
               <Sparkles className="w-4 h-4 text-blue-500" />
               <span className="text-[12px] font-semibold tracking-wider uppercase text-blue-600">
                  La Evolución de Tu Salud
               </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-[52px] sm:text-[72px] lg:text-[84px] font-extrabold tracking-tight leading-[1]"
            >
              <span className="text-gray-900">Bienestar</span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0071e3] to-[#00aaff]">
                Reimaginado.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-[19px] sm:text-[22px] text-gray-500 max-w-[700px] mx-auto leading-relaxed font-medium"
            >
              Servicios de salud de nueva generación. Equipo de élite, atención premium y un sistema de reservas que respeta tu tiempo.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
            >
              <Link href="/es/services">
                <Button className="w-full sm:w-auto bg-[#0071e3] hover:bg-[#005bb5] text-white px-8 py-7 rounded-full text-[17px] font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  Explorar Servicios
                </Button>
              </Link>
              <Link href="/es/about">
                <Button className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-8 py-7 rounded-full text-[17px] font-semibold shadow-sm transition-all duration-300 hover:scale-[1.02]">
                  Conocer Más
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURES                                                     */}
      {/* ============================================================ */}
      <section ref={featuresRef} className="py-32 relative">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-20"
          >
            <h2 className="text-[36px] sm:text-[48px] font-bold text-gray-900 tracking-tight mb-4">
              Diseñado pensando en ti.
            </h2>
            <p className="text-[20px] text-gray-500 max-w-[600px] mx-auto font-medium">
               Pioneros en unir tecnología, comodidad y profesionales de la salud.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Calendar,
                title: 'Reservas Fluidas',
                description: 'Agenda tus citas en menos de un minuto desde cualquier dispositivo, sin llamadas.',
              },
              {
                icon: Users,
                title: 'Equipo Experto',
                description: 'Profesionales altamente capacitados seleccionados por su experiencia.',
              },
              {
                icon: Shield,
                title: 'Máxima Privacidad',
                description: 'Tus datos clínicos y personales blindados con encriptación de grado médico.',
              },
              {
                icon: Sparkles,
                title: 'Experiencia Premium',
                description: 'Desde nuestra plataforma hasta la consulta, un trato exquisito.',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate={featuresInView ? 'visible' : 'hidden'}
                className="bg-white/60 backdrop-blur-xl rounded-[28px] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-[16px] bg-[#0071e3]/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-[#0071e3]" />
                </div>
                <h3 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-3">{feature.title}</h3>
                <p className="text-[15px] font-medium text-gray-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SERVICES PREVIEW                                             */}
      {/* ============================================================ */}
      <section ref={servicesRef} className="py-32 bg-white relative">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
          >
            <div>
              <h2 className="text-[36px] sm:text-[48px] font-bold text-gray-900 tracking-tight mb-4">
                Encuentra tu servicio
              </h2>
              <p className="text-[20px] text-gray-500 max-w-[600px] font-medium">
                Cobertura integral para llevar tu salud al siguiente nivel.
              </p>
            </div>
            <Link href="/es/services">
               <span className="text-[16px] font-semibold text-[#0071e3] hover:underline flex items-center gap-2 cursor-pointer">
                  Ver catálogo completo <ArrowRight className="w-4 h-4" />
               </span>
            </Link>
          </motion.div>

          {dataLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-[28px] overflow-hidden animate-pulse border border-gray-100">
                  <div className="h-[200px] bg-gray-200" />
                  <div className="p-7 space-y-4">
                    <div className="h-5 bg-gray-200 rounded-full w-2/3" />
                    <div className="h-4 bg-gray-200 rounded-full w-full" />
                    <div className="h-4 bg-gray-200 rounded-full w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredServices.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredServices.map((svc, i) => (
                <motion.div
                  key={svc.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate={servicesInView ? 'visible' : 'hidden'}
                >
                  <Link href={`/es/services/${svc.id}`}>
                    <div className="group bg-[#f5f5f7] rounded-[28px] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                      <div className="relative h-[220px] overflow-hidden bg-gray-200">
                        <img
                          src={svc.image || pickServiceImage(svc.name)}
                          alt={svc.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        />
                      </div>
                      <div className="p-7 bg-white group-hover:bg-gray-50/50 transition-colors">
                        <h3 className="text-[19px] font-semibold text-gray-900 tracking-tight mb-2">
                           {svc.name}
                        </h3>
                        <p className="text-[14px] font-medium text-gray-500 leading-relaxed">
                          {svc.description?.slice(0, 90) + ((svc.description?.length || 0) > 90 ? '...' : '')}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-[16px] font-medium text-gray-500 py-12 bg-gray-50 rounded-[28px] border border-gray-100 border-dashed">
              Descubriendo servicios en breves.
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STATS                                                        */}
      {/* ============================================================ */}
      <section ref={statsRef} className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <div className="bg-white/80 backdrop-blur-xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-12">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
               {[
                 { value: countPatients, suffix: '+', label: 'Personas Atendidas', format: true },
                 { value: professionalsCount !== null ? countProfessionals : null, suffix: ' Doc.', label: 'Profesionales', format: false },
                 { value: countYears, suffix: '', label: 'Años Operando', format: false },
                 { value: countSatisfaction, suffix: '%', label: 'Satisfacción', format: false },
               ].map((stat, i) => (
                 <motion.div
                   key={stat.label}
                   custom={i}
                   variants={fadeUp}
                   initial="hidden"
                   animate={statsInView ? 'visible' : 'hidden'}
                 >
                   <div className="text-[42px] sm:text-[56px] font-extrabold tracking-tight mb-2 text-gray-900 leading-none">
                     {stat.value !== null ? `${stat.format ? stat.value.toLocaleString('es-ES') : stat.value}${stat.suffix}` : '—'}
                   </div>
                   <p className="text-[15px] font-medium text-gray-500">{stat.label}</p>
                 </motion.div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TESTIMONIALS                                                 */}
      {/* ============================================================ */}
      {testimonials.length > 0 && (
        <section ref={testimonialsRef} className="py-32 bg-white">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center mb-20"
            >
              <h2 className="text-[36px] sm:text-[48px] font-bold text-gray-900 tracking-tight mb-4">
                No confíes en nosotros.<br />Confía en ellos.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((review, i) => (
                <motion.article
                  key={review.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate={testimonialsInView ? 'visible' : 'hidden'}
                  className="bg-[#f5f5f7] rounded-[28px] p-8 transition-transform duration-300 hover:-translate-y-2"
                >
                  <Quote className="w-10 h-10 text-gray-300 mb-6" />
                  <p className="text-gray-900 font-medium leading-relaxed mb-8 text-[16px]">
                    "{review.comment}"
                  </p>
                  <div className="flex flex-col gap-1 mt-auto">
                     <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                           <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-[#0071e3] text-[#0071e3]' : 'text-gray-300'}`} />
                        ))}
                     </div>
                     <p className="text-[15px] font-bold text-gray-900 tracking-tight">{review.client_name}</p>
                     <p className="text-[13px] font-medium text-gray-500">
                        Tratamiento con {review.professional_name}
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
      <section ref={ctaRef} className="py-32 bg-[#0071e3] text-white">
        <div className="container mx-auto px-4 text-center max-w-[800px]">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={ctaInView ? 'visible' : 'hidden'}
            className="space-y-8"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-[40px] sm:text-[56px] font-bold tracking-tight leading-[1.1]"
            >
              Comienza hoy a priorizar<br />
              tu salud.
            </motion.h2>

            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-[20px] text-white/80 max-w-[600px] mx-auto font-medium"
            >
               Únete a miles de personas que gestionan sus citas de manera inteligente con NeoCore.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="flex justify-center pt-6"
            >
              <Link href="/es/register">
                <Button className="bg-white hover:bg-gray-50 text-[#0071e3] px-10 py-7 rounded-full text-[17px] font-bold shadow-xl transition-all duration-300 hover:scale-[1.03]">
                  Crear Cuenta y Reservar
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
