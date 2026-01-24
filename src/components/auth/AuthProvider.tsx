'use client';
import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthProviderProps {
  children: ReactNode;
}

function FirebaseTokenSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    async function syncToken() {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          // 1. Get custom token from our API
          const response = await fetch('/api/auth/firebase', {
            method: 'POST',
          });

          if (!response.ok) throw new Error('Failed to get token');

          const { token } = await response.json();

          // 2. Sign in to Firebase directly
          await signInWithCustomToken(auth, token);
          console.log('[Firebase] Synced auth state with NextAuth');
        } catch (error) {
          console.error('[Firebase] Failed to sync auth:', error);
        }
      }
    }

    syncToken();
  }, [session, status]);

  return null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <FirebaseTokenSync />
      {children}
    </SessionProvider>
  );
}
