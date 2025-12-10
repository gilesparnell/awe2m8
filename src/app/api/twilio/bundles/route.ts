
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

        console.log(`Fetching bundles for ${subAccountSid || 'Master Account'}... Page: ${page}, Size: ${pageSize}`);

        // If subAccountSid is provided, we act on behalf of that account
        // using the Master Credentials
        const client = subAccountSid
            ? twilio(accountSid, authToken, { accountSid: subAccountSid })
            : twilio(accountSid, authToken);

        // Note: The Twilio Node helper library 'list' method often automates paging to get 'limit' items.
        // To get a specific 'page', we might need to use 'page' method instead of 'list',
        // OR rely on the fact that 'list' fetches the first N items.
        // If we want "Page 2" (items 11-20), 'list' isn't the best tool if we want efficient server-side paging without fetching everything.
        // However, for simplicity in this V2 implementation:
        // Twilio's `list` fetches up to `limit`. If we want page 2, we can't easily jump there without `page` method or URL from previous page.
        // BUT, `regulatoryCompliance.bundles.page({ pageNumber: X, pageSize: Y })` IS available.

        let bundles;
        if (url.searchParams.has("page")) {
            // Use explicit paging
            const pageResponse = await client.numbers.v2.regulatoryCompliance.bundles.page({
                pageSize: pageSize,
                pageNumber: page
            });
            bundles = pageResponse.instances;
        } else {
            // Default "list" behavior (fetch top N)
            const listParams: any = {
                limit: Math.min(limit, 100), // Cap at 100
            };
            if (friendlyName) {
                listParams.friendlyName = friendlyName;
            }
            bundles = await client.numbers.v2.regulatoryCompliance.bundles.list(listParams);
        }

        console.log(`Found ${bundles.length} bundles.`);

        return NextResponse.json({ results: bundles });
    } catch (error: any) {
        console.error("Twilio API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch bundles", details: error },
            { status: 500 }
        );
    }
}
