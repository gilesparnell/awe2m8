import { NextResponse } from 'next/server';
import { isAdminEmail, getAdminUser } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    const results = {
        env: {
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKeyStart: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.substring(0, 20) : 'MISSING',
            privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.length : 0,
        },
        tests: [] as any[]
    };

    const testEmails = ['gilesparnell@gmail.com', 'gilesparnell69@gmail.com', 'admin@awe2m8.ai'];

    for (const email of testEmails) {
        try {
            console.log(`Testing email: ${email}`);
            const isAdmin = await isAdminEmail(email);
            const user = await getAdminUser(email);
            results.tests.push({
                email,
                isAdmin,
                userFound: !!user,
                userData: user,
                status: 'success'
            });
        } catch (error: any) {
            results.tests.push({
                email,
                error: error.message,
                stack: error.stack,
                status: 'error'
            });
        }
    }

    return NextResponse.json(results);
}
