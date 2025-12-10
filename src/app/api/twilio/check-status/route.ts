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
                    // Use the SMS account that owns the phone number
                    const smsAccountSid = process.env.TWILIO_SMS_ACCOUNT_SID || accountSid;
                    const smsAuthToken = process.env.TWILIO_SMS_AUTH_TOKEN || authToken;
                    const smsClient = twilio(smsAccountSid, smsAuthToken);

                    // Fetch account details to get friendly name
                    const account = await client.api.accounts(bundle.accountSid).fetch();

                    // Get notification numbers from configuration
                    const { getNotificationNumbers } = require('@/lib/twilio-helpers');
                    const notifyNumbers = getNotificationNumbers();

                    await Promise.all(notifyNumbers.map((number: string) =>
                        smsClient.messages.create({
                            body: `🎉 Great News! Regulatory Bundle Approved.\n\nClient: ${account.friendlyName}\nBundle: ${bundle.friendlyName}\n\nYour Twilio phone numbers are now ready to use!`,
                            from: '+61485009296',
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
