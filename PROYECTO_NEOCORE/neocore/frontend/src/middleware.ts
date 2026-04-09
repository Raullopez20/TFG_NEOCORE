import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames
  // Excluimos /api/* del matcher para que el rewrite a backend de
  // next.config.js funcione (si no, next-intl redirige /api -> /es/api).
  matcher: ['/', '/(es|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
