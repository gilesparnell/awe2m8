import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: Request) {
    let { accountSid, authToken } = await request.json();

    // Fallback to Server Environment Variables if not provided by client
    if (!accountSid || !authToken) {
        accountSid = process.env.TWILIO_ACCOUNT_SID;
        authToken = process.env.TWILIO_AUTH_TOKEN;
    }

    if (!accountSid || !authToken) {
        return NextResponse.json({ success: false, error: "Missing Twilio Credentials (ENV or Body)" }, { status: 401 });
    }

    const client = twilio(accountSid, authToken);

    try {
        // Use specific phone number for SMS sending
        // Phone: +61485009296 (Australian number for AWE2M8)
        const fromNumber = '+61485009296';

        console.log(`Using Twilio number: ${fromNumber} for test SMS`);

        const notifyNumbers = ['+61401027141', '+61404283605'];
        const results = await Promise.all(notifyNumbers.map(number =>
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
            sentTo: notifyNumbers
        });
    } catch (error: any) {
        console.error('Test SMS Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
