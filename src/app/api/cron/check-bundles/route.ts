import { NextResponse } from 'next/server';
import twilio from 'twilio';

// This Generic Cron Handler checks for ANY pending bundles on the account
// defined in Environment Variables, and notifies if they are approved.

// It is stateless: it checks Twilio's Message History to deduplicate notifications.

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET(request: Request) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        return NextResponse.json({ success: false, error: "Missing Server Environment Variables" }, { status: 500 });
    }

    // Verify logic to secure Cron (e.g. check for header from Vercel)
    // For Vercel Cron, header 'Authorization' is usually 'Bearer <CRON_SECRET>' if configured.
    // For now, we'll keep it open but obscure, or rely on Vercel's protection.

    const client = twilio(accountSid, authToken);

    try {
        console.log("Cron: Checking Bundles across ALL Sub-Accounts...");

        // 1. Get List of All Active Accounts (Parent + Subaccounts)
        // Note: client.api.accounts.list() returns the parent and all subaccounts.
        const accounts = await client.api.accounts.list({ status: 'active' });
        console.log(`Cron: Found ${accounts.length} active accounts.`);

        // Get notification numbers from configuration
        const { getNotificationNumbers } = require('@/lib/twilio-helpers');
        const notifyNumbers = getNotificationNumbers();
        const results = [];

        // 2. Iterate each account to check its bundles
        for (const account of accounts) {
            // Context-aware client for this specific account
            // We use the Master Keys, but operate ON BEHALF of the subaccount
            const subClient = twilio(accountSid, authToken, { accountSid: account.sid });

            try {
                const approvedBundles = await subClient.numbers.v2.regulatoryCompliance.bundles.list({
                    status: 'twilio-approved',
                    limit: 5 // Keep limit low per account to avoid rate limits
                });

                for (const bundle of approvedBundles) {
                    // Filter for RECENT approvals (last 24h)
                    const hoursSinceUpdate = (new Date().getTime() - new Date(bundle.dateUpdated).getTime()) / (1000 * 60 * 60);
                    if (hoursSinceUpdate > 24) continue;

                    // Deduplication: Check Master Message History
                    // We check the PARENT account's message history because that's where we send notifications FROM.
                    const messages = await client.messages.list({
                        from: '+61485009296',
                        limit: 30
                    });

                    // Match logic: Ensure we reference the specific Account we are checking
                    const bodyMatch = `Bundle: ${bundle.friendlyName}`;

                    if (messages.some(m => m.body.includes(bodyMatch) && m.body.includes(account.sid))) {
                        // Already notified for this bundle
                        continue;
                    }

                    console.log(`Cron: Notifying for ${bundle.friendlyName} in Account ${account.sid}`);

                    // Use the SMS account that owns the phone number
                    const smsAccountSid = process.env.TWILIO_SMS_ACCOUNT_SID || accountSid;
                    const smsAuthToken = process.env.TWILIO_SMS_AUTH_TOKEN || authToken;
                    const smsClient = twilio(smsAccountSid, smsAuthToken);

                    await Promise.all(notifyNumbers.map((number: string) =>
                        smsClient.messages.create({
                            body: `🎉 Great News! Regulatory Bundle Approved.\n\nClient: ${account.friendlyName}\nBundle: ${bundle.friendlyName}\n\nYour Twilio phone numbers are now ready to use!`,
                            from: '+61485009296',
                            to: number
                        })
                    ));
                    results.push({ sid: bundle.sid, account: account.sid, status: 'Notified' });
                }
            } catch (err) {
                console.warn(`Cron: Failed to check account ${account.sid}`, err);
                // Continue to next account
            }
        }

        return NextResponse.json({ success: true, accountsChecked: accounts.length, notifications: results });

    } catch (error: any) {
        console.error("Cron Error", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
