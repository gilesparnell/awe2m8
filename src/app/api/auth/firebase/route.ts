
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createFirebaseCustomToken } from '@/lib/firebase-admin';

export async function POST() {
    try {
        const session = await auth();

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create a custom token for the user using their email as the UID (or use a consistent mapping)
        // Using email as UID for simplicity and consistency with current admin lookup
        const token = await createFirebaseCustomToken(session.user.email);

        return NextResponse.json({ token });
    } catch (error: any) {
        console.error('Error creating custom token:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
