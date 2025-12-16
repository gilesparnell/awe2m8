import { NextResponse } from 'next/server';
import { getNotificationNumbers, saveNotificationNumbers } from '@/lib/twilio-helpers';

export async function GET() {
    const notificationNumbers = getNotificationNumbers();

    // Check for existence of Env Vars (do NOT return values)
    const envStatus = {
        TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
        TWILIO_SMS_ACCOUNT_SID: !!process.env.TWILIO_SMS_ACCOUNT_SID,
        TWILIO_SMS_AUTH_TOKEN: !!process.env.TWILIO_SMS_AUTH_TOKEN,
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY
    };

    // Subaccounts for Number Manager
    // These can be extended via a database in the future
    const subAccounts = [
        { sid: process.env.TWILIO_SUBACCOUNT_AWE2M8 || '', friendlyName: 'AWE2M8' },
        { sid: process.env.TWILIO_SUBACCOUNT_TEST || '', friendlyName: 'Test' },
        { sid: process.env.TWILIO_SUBACCOUNT_77 || '', friendlyName: 'Account 77' },
        { sid: process.env.TWILIO_SUBACCOUNT_FITNESS || '', friendlyName: 'Fitness Boxx' },
    ].filter(a => a.sid); // Only return accounts with configured SIDs

    return NextResponse.json({ notificationNumbers, envStatus, subAccounts });
}

export async function POST(request: Request) {
    try {
        const { notificationNumbers } = await request.json();

        if (!Array.isArray(notificationNumbers)) {
            return NextResponse.json({ error: 'notificationNumbers must be an array' }, { status: 400 });
        }

        saveNotificationNumbers(notificationNumbers);
        return NextResponse.json({ success: true, notificationNumbers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
