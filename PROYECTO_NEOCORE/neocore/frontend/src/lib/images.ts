/**
 * Imágenes de fallback (Unsplash) para servicios y profesionales sin foto subida.
 * Centralizadas aquí para que todas las páginas usen las mismas.
 */

const U = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;

// ── Servicios: keyword del nombre → imagen (las claves más específicas primero) ──
const SERVICE_IMAGES: [string[], string][] = [
  [['pisada', 'biomecánic'], U('photo-1508387027939-27cccde53673', 800, 500)],
  [['quiropodia', 'podol'], U('photo-1544161515-4ab6ce6db874', 800, 500)],
  [['acupuntura'], U('photo-1598555763574-dca77e10427e', 800, 500)],
  [['logopedia'], U('photo-1516627145497-ae6968895b74', 800, 500)],
  [['traumatolog'], U('photo-1551190822-a9333d879b1f', 800, 500)],
  [['pilates'], U('photo-1518611012118-696072aa579a', 800, 500)],
  [['rehabilitación', 'rehabilitacion'], U('photo-1571019613454-1cb2f99b2d8b', 800, 500)],
  [['fisioterapia'], U('photo-1576091160550-2173dba999ef', 800, 500)],
  [['quiromasaje'], U('photo-1519823551278-64ac92734fb1', 800, 500)],
  [['masaje'], U('photo-1611073615452-4889cb93422e', 800, 500)],
  [['osteopat'], U('photo-1544161515-4ab6ce6db874', 800, 500)],
  [['entrenamiento', 'fitness'], U('photo-1534438327276-14e5300c3a48', 800, 500)],
  [['deportiva', 'deportivo'], U('photo-1506126613408-eca07ce68773', 800, 500)],
  [['psicológica', 'psicolog', 'terapia'], U('photo-1527137342181-19aab11a8ee8', 800, 500)],
  [['seguimiento', 'dietética', 'dietetica'], U('photo-1490645935967-10de6ba17061', 800, 500)],
  [['nutric', 'alimentación'], U('photo-1512621776951-a57141f2eefd', 800, 500)],
  [['cardiolog'], U('photo-1628348070889-cb656235b4eb', 800, 500)],
  [['dermatolog'], U('photo-1570172619644-dfd03ed5d881', 800, 500)],
  [['yoga', 'mindfulness', 'meditación'], U('photo-1544367567-0f2fcb009e0b', 800, 500)],
];

const SERVICE_DEFAULT = U('photo-1576091160399-112ba8d25d1d', 800, 500);

export function getServiceImage(name: string): string {
  const n = (name || '').toLowerCase();
  for (const [keys, url] of SERVICE_IMAGES) {
    if (keys.some(k => n.includes(k))) return url;
  }
  return SERVICE_DEFAULT;
}

// ── Profesionales: especialidad → retrato (claves específicas primero) ──────────
const PROFESSIONAL_IMAGES: [string[], string][] = [
  [['psicología clínica', 'psicologia clinica'], U('photo-1573496359142-b8d87734a5a2', 400, 400)],
  [['psicología deportiva', 'psicologia deportiva', 'psicolog'], U('photo-1507003211169-0a1dd7228f2d', 400, 400)],
  [['dietética clínica', 'dietetica clinica'], U('photo-1472099645785-5658abf4ff4e', 400, 400)],
  [['nutrición', 'nutricion'], U('photo-1622253692010-333f2da6031d', 400, 400)],
  [['fisioterapia'], U('photo-1559839734-2b71ea197ec2', 400, 400)],
  [['entrenamiento'], U('photo-1567532939604-b6b5b0db2604', 400, 400)],
  [['cardiolog'], U('photo-1594824476967-48c8b964273f', 400, 400)],
  [['dermatolog'], U('photo-1612349317150-e413f6a5b16d', 400, 400)],
  [['medicina', 'médic', 'medic'], U('photo-1551836022-d5d88e9218df', 400, 400)],
  [['osteopat'], U('photo-1582750433449-648ed127bb54', 400, 400)],
  [['yoga', 'mindfulness'], U('photo-1544005313-94ddf0286df2', 400, 400)],
  [['rehabilitación', 'rehabilitacion'], U('photo-1537368910025-700350fe46c7', 400, 400)],
  [['podolog'], U('photo-1580489944761-15a19d654956', 400, 400)],
  [['pilates'], U('photo-1438761681033-6461ffad8d80', 400, 400)],
  [['quiromasaje', 'masaje'], U('photo-1500648767791-00dcc994a43e', 400, 400)],
  [['logopedia'], U('photo-1594744803329-e58b31de8bf5', 400, 400)],
  [['traumatolog'], U('photo-1560250097-0b93528c311a', 400, 400)],
  [['acupuntura'], U('photo-1519085360753-af0119f7cbe7', 400, 400)],
];

const PROFESSIONAL_DEFAULT = U('photo-1612349317150-e413f6a5b16d', 400, 400);

export function getProfessionalImage(specialty: string): string {
  const n = (specialty || '').toLowerCase();
  for (const [keys, url] of PROFESSIONAL_IMAGES) {
    if (keys.some(k => n.includes(k))) return url;
  }
  return PROFESSIONAL_DEFAULT;
}
