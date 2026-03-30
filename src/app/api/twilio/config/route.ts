import { NextResponse } from 'next/server';
import { getNotificationNumbers } from '@/lib/twilio-helpers';
import { auth } from '@/lib/auth';

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notificationNumbers = getNotificationNumbers();

    // Check for existence of Env Vars (do NOT return values)
    const envStatus = {
        TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
        TWILIO_SMS_ACCOUNT_SID: !!process.env.TWILIO_SMS_ACCOUNT_SID,
        TWILIO_SMS_AUTH_TOKEN: !!process.env.TWILIO_SMS_AUTH_TOKEN,
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY
    };

    return NextResponse.json({ notificationNumbers, envStatus });
}
