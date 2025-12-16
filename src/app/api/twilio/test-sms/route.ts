import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For SMS sending, we need to use the account that owns the phone number
    // The phone number +61485009296 belongs to a specific account
    // Use TWILIO_SMS_ACCOUNT_SID and TWILIO_SMS_AUTH_TOKEN if available
    const smsAccountSid = process.env.TWILIO_SMS_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
    const smsAuthToken = process.env.TWILIO_SMS_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;

    if (!smsAccountSid || !smsAuthToken) {
        return NextResponse.json({
            success: false,
            error: "Missing SMS account credentials. Please configure TWILIO_SMS_ACCOUNT_SID and TWILIO_SMS_AUTH_TOKEN environment variables."
        }, { status: 401 });
    }

    // Use the account that owns the phone number for sending
    const client = twilio(smsAccountSid, smsAuthToken);

    try {
        // Use specific phone number for SMS sending
        // Phone: +61485009296 (Australian number for AWE2M8)
        // This number must belong to the account specified by smsAccountSid
        const fromNumber = '+61485009296';

        console.log(`Using Twilio number: ${fromNumber} for test SMS from account: ${smsAccountSid}`);

        // Get notification numbers from configuration
        const { getNotificationNumbers } = require('@/lib/twilio-helpers');
        const notifyNumbers = getNotificationNumbers();

        const results = await Promise.all(notifyNumbers.map((number: string) =>
            client.messages.create({
                body: '🔔 Test SMS from AWE2M8 Twilio Admin. Your configuration is working correctly!',
                from: fromNumber,
                to: number
            })
        ));

        return NextResponse.json({
            success: true,
            sids: results.map(m => m.sid),
            from: fromNumber,
            sentTo: notifyNumbers,
            accountUsed: smsAccountSid
        });
    } catch (error: any) {
        console.error('Test SMS Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
