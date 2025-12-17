import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';
import { isAdminEmail, getAdminUser, updateLastLogin } from './firebase-admin';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      console.log(`[Auth] Attempting sign-in for: ${user.email}`);

      if (!user.email) {
        console.error('[Auth] No email provided in user object');
        return false;
      }

      try {
        // Check if email is in admin whitelist
        const isAdmin = await isAdminEmail(user.email);
        console.log(`[Auth] isAdminEmail result for ${user.email}:`, isAdmin);

        if (!isAdmin) {
          console.warn(`[Auth] Access denied for ${user.email} - not in whitelist`);
          return '/login?error=AccessDenied';
        }

        // Update last login timestamp
        await updateLastLogin(user.email);
        console.log(`[Auth] Login successful and timestamp updated for ${user.email}`);
      } catch (error: any) {
        console.error('[Auth] Critical error during sign-in check:', error);
        // Return generic error to avoid exposing stack trace details if needed, or allow fail
        return '/login?error=AccessDenied';
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const adminUser = await getAdminUser(user.email);
        if (adminUser) {
          token.isAdmin = true;
          token.role = adminUser.role || 'admin';
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
});
