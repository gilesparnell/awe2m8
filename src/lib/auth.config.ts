
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const pathname = nextUrl.pathname;

            // Public routes that don't require auth
            if (pathname === '/login' || pathname.startsWith('/api/auth')) {
                return true;
            }

            // Check if this is a public demo page ([clientId] route)
            const protectedPaths = ['admin', 'demos', 'twilio', 'api', 'login', '_next'];
            const segments = pathname.split('/').filter(Boolean);
            if (segments.length === 1 && !protectedPaths.includes(segments[0])) {
                return true; // Allow public demo pages
            }

            // All other routes require authentication
            const isProtectedRoute =
                pathname === '/' ||
                pathname.startsWith('/admin') ||
                pathname.startsWith('/demos') ||
                pathname.startsWith('/twilio') ||
                pathname.startsWith('/api/');

            if (isProtectedRoute) {
                return isLoggedIn;
            }

            return true;
        },
    },
    providers: [], // Providers added in full auth config to avoid Edge runtime issues with some libraries
} satisfies NextAuthConfig;
