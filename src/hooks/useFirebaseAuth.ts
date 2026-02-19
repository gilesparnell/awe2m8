import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { auth } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';

export function useFirebaseAuth() {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            // Sign in anonymously to Firestore so we can write data
            if (!auth.currentUser) {
                console.log('🔄 Signing in anonymously to Firestore...');
                signInAnonymously(auth)
                    .then((userCredential) => {
                        console.log('✅ Anonymous Firebase auth successful');
                    })
                    .catch(err => {
                        console.error('❌ Anonymous auth failed:', err.message);
                    });
            }
        }
    }, [session, status]);
}
