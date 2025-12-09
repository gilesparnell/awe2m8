import { NextResponse } from 'next/server';
import twilio from 'twilio';
import fs from 'fs';
import path from 'path';

const SMS_LOG_FILE = path.join(process.cwd(), 'src', 'app', 'api', 'twilio', 'sms_log.json');

// Helper to check/update log
function recordSmsSent(bundleSid: string): boolean {
    try {
        let log: string[] = [];
        if (fs.existsSync(SMS_LOG_FILE)) {
            log = JSON.parse(fs.readFileSync(SMS_LOG_FILE, 'utf-8'));
        }
        if (log.includes(bundleSid)) return false; // Already sent

        log.push(bundleSid);
        fs.writeFileSync(SMS_LOG_FILE, JSON.stringify(log, null, 2));
        return true; // Sent newly
    } catch (e) {
        console.error("SMS Log Error", e);
        return true; // value safety over blocking? Or false to prevent spam? Assume true to allow send if fs fails.
    }
}

export async function POST(request: Request) {
    const { accountSid, authToken, bundleSid } = await request.json();
    const client = twilio(accountSid, authToken);

    try {
        // Fetch fresh bundle status
        const bundle = await client.numbers.v2.regulatoryCompliance.bundles(bundleSid).fetch();

        // Check approval
        let smsSent = false;
        if (bundle.status === 'twilio-approved') {
            // Check if we already sent SMS for this specific bundle approval
            const shouldSend = recordSmsSent(bundleSid);

            if (shouldSend) {
                try {
                    const notifyNumbers = ['+61401027141', '+61404283605'];
                    await Promise.all(notifyNumbers.map(number =>
                        client.messages.create({
                            body: `Great News. Regulatory Bundle Approved.\n\nAccount: ${bundle.accountSid}\nBundle: ${bundle.friendlyName}`,
                            from: 'AWE2M8',
                            to: number
                        })
                    ));
                    smsSent = true;
                } catch (smsError) {
                    console.warn('SMS Failed:', smsError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            status: bundle.status,
            smsSent: smsSent
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
