import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
    // Match all paths starting with /admin
    matcher: ['/admin/:path*'],
};
