import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico (browser icon)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.svg$).*)',
  ],
};
