'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Redireccion por defecto del backoffice.
 *
 * Cuando un admin entra a /es/backoffice (sin subruta) lo enviamos
 * directamente al dashboard, que es la pantalla principal del panel.
 */
export default function BackofficeIndexPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';

  useEffect(() => {
    router.replace(`/${locale}/backoffice/dashboard`);
  }, [router, locale]);

  return null;
}
