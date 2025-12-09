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
        const notifyNumbers = ['+61401027141', '+61404283605'];
        const results = await Promise.all(notifyNumbers.map(number =>
            client.messages.create({
                body: '🔔 Status: Bundle Created. This is a TEST message from AWE2M8 Admin.',
                from: 'AWE2M8',
                to: number
            })
        ));
        return NextResponse.json({ success: true, sids: results.map(m => m.sid) });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
