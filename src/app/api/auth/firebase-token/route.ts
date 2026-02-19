import { auth } from '@/lib/auth'; // NextAuth v5
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
let adminAuth: any;

try {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
        ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    console.log('🔧 Admin SDK Init:', {
        hasProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        hasPrivateKey: !!privateKey,
        privateKeyStart: privateKey?.substring(0, 50),
    });

    const firebaseAdminConfig = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
    };

    const adminApp = !getApps().length
        ? initializeApp({
            credential: cert(firebaseAdminConfig as any),
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        })
        : getApp();

    adminAuth = getAdminAuth(adminApp);
    console.log('✅ Firebase Admin SDK initialized');
} catch (error: any) {
    console.error('❌ Firebase Admin SDK init failed:', error.message);
}

export async function GET() {
    try {
        console.log('🔑 Firebase token endpoint called');

        const session = await auth();
        console.log('📧 Session user:', session?.user?.email);

        if (!session?.user?.email) {
            console.log('❌ No session/email');
            return Response.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        console.log('🔏 Creating custom token for:', session.user.email);

        // Create a custom token for this user
        const token = await adminAuth.createCustomToken(session.user.email);

        console.log('✅ Token created successfully');
        return Response.json({ token });
    } catch (error: any) {
        console.error('❌ Firebase token generation failed:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
        });
        return Response.json(
            { error: error.message || 'Token generation failed' },
            { status: 500 }
        );
    }
}
