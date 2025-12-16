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
      if (!user.email) {
        return false;
      }

      // Check if email is in admin whitelist
      const isAdmin = await isAdminEmail(user.email);
      if (!isAdmin) {
        return '/login?error=AccessDenied';
      }

      // Update last login timestamp
      try {
        await updateLastLogin(user.email);
      } catch (e) {
        // Don't block login if update fails
        console.error('Failed to update last login:', e);
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
