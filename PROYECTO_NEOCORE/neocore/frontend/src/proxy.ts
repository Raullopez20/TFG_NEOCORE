import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Vercel rewrites handle these — do NOT apply i18n routing.
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_vercel/')
  ) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  // Broad matcher — the function itself guards the paths above.
  matcher: ['/((?!_next/static|_next/image|_vercel|favicon\\.ico).*)'],
};
