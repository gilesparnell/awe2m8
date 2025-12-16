import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Auth routes are always accessible
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Login page accessible to unauthenticated users
  if (pathname === '/login') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // Check if this is a public demo page (dynamic [clientId] route)
  // These are single-segment paths that aren't protected routes
  const protectedPaths = ['admin', 'demos', 'twilio', 'api', 'login', '_next'];
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 1 && !protectedPaths.includes(segments[0])) {
    // This is likely a [clientId] demo page - allow public access
    return NextResponse.next();
  }

  // Protected routes that require authentication
  const isProtectedRoute =
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/demos') ||
    pathname.startsWith('/twilio') ||
    (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth'));

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
