
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

        console.log(`Fetching bundles for ${subAccountSid || 'Master Account'}...`);

        // If subAccountSid is provided, we act on behalf of that account
        // using the Master Credentials
        const client = subAccountSid
            ? twilio(accountSid, authToken, { accountSid: subAccountSid })
            : twilio(accountSid, authToken);

        const listParams: any = {
            limit: Math.min(limit, 100), // Cap at 100
        };

        if (friendlyName) {
            listParams.friendlyName = friendlyName;
        }

        const bundles = await client.numbers.v2.regulatoryCompliance.bundles.list(listParams);

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
