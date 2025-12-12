
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

// Helper to get Twilio Client from headers OR env
const getTwilioClient = (req: NextRequest) => {
    // 1. Try to get credentials from Headers (Client-side override)
    let accountSid = req.headers.get("x-twilio-account-sid");
    let authToken = req.headers.get("x-twilio-auth-token");

    // 2. Fallback to Server Environment Variables
    if (!accountSid || !authToken) {
        accountSid = process.env.TWILIO_ACCOUNT_SID || null;
        authToken = process.env.TWILIO_AUTH_TOKEN || null;
    }

    if (!accountSid || !authToken) {
        throw new Error("Missing Twilio credentials. Set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN env vars or provide headers.");
    }

    return twilio(accountSid, authToken);
};

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const subAccountSid = url.searchParams.get("subAccountSid");

        // 1. Get Base Client (Master or Header-provided)
        // We do this MANUALLY instead of helper to support subAccount switching logic
        let accountSid = req.headers.get("x-twilio-account-sid");
        let authToken = req.headers.get("x-twilio-auth-token");

        if (!accountSid || !authToken) {
            accountSid = process.env.TWILIO_ACCOUNT_SID || null;
            authToken = process.env.TWILIO_AUTH_TOKEN || null;
        }

        if (!accountSid || !authToken) {
            return NextResponse.json({ error: "Missing Twilio credentials" }, { status: 401 });
        }

        const friendlyName = url.searchParams.get("friendlyName");
        const limit = parseInt(url.searchParams.get("limit") || "50", 10);
        const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);
        const page = parseInt(url.searchParams.get("page") || "0", 10);

        let bundles: any[] = [];

        if (subAccountSid) {
            // SINGLE ACCOUNT MODE
            console.log(`Fetching bundles for SubAccount: ${subAccountSid}...`);
            const client = twilio(accountSid, authToken, { accountSid: subAccountSid });

            if (url.searchParams.has("page")) {
                const pageResponse = await client.numbers.v2.regulatoryCompliance.bundles.page({
                    pageSize: pageSize,
                    pageNumber: page
                });
                bundles = pageResponse.instances;
            } else {
                const listParams: any = { limit: Math.min(limit, 100) };
                if (friendlyName) listParams.friendlyName = friendlyName;
                bundles = await client.numbers.v2.regulatoryCompliance.bundles.list(listParams);
            }
        } else {
            // AGGREGATION MODE (Master + All Subs)
            console.log("Fetching bundles for Master + All Active Subaccounts (Aggregation Mode)...");

            // 1. Get List of All Active Accounts (Master is implicit, Actvity returns Subs)
            const subAccounts = await twilio(accountSid, authToken).api.v2010.accounts.list({ status: 'active', limit: 50 });

            // 2. Build list of targets: [Master, ...Subs]
            // We store generic info to attach helpful context if possible
            const targets = [
                { sid: accountSid, name: 'Master Account' },
                ...subAccounts.map(a => ({ sid: a.sid, name: a.friendlyName }))
            ];

            console.log(`Aggregating bundles from ${targets.length} accounts...`);

            // 3. Fetch recent bundles for each in parallel
            const promises = targets.map(async (target) => {
                try {
                    const subClient = twilio(accountSid, authToken, { accountSid: target.sid });
                    // We fetch 'limit' for EACH to ensure we don't miss recent ones from a busy subaccount, 
                    // then we sort globally.
                    const res = await subClient.numbers.v2.regulatoryCompliance.bundles.list({
                        limit: 10 // Fetch top 10 from each to keep payload manageable yet representative
                    });

                    // Attach context? The BundleInstance object is complex, spreading it might lose prototype methods if not careful,
                    // but for JSON serialization it's fine.
                    // We'll attach 'accountName' for UI if needed.
                    return res.map(b => ({
                        ...b.toJSON(), // Ensure we serialize strictly properties 
                        accountName: target.name,
                        _accountSid: target.sid // Helper for debugging
                    }));
                } catch (err: any) {
                    console.warn(`Failed to fetch bundles for ${target.name} (${target.sid}): ${err.message}`);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            const allBundles = results.flat();

            // 4. Sort Globally by DateCreated Descending
            bundles = allBundles.sort((a, b) => {
                const da = new Date(a.dateCreated).getTime();
                const db = new Date(b.dateCreated).getTime();
                return db - da; // Descending
            });

            // 5. Apply Limit globally
            if (!url.searchParams.has("page")) { // Only limit if not paging (though paging aggregate is unsupported here)
                bundles = bundles.slice(0, limit);
            }
        }

        console.log(`Found ${bundles ? bundles.length : 0} bundles total.`);

        return NextResponse.json({ results: bundles });
    } catch (error: any) {
        console.error("Twilio API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch bundles", details: error },
            { status: 500 }
        );
    }
}
