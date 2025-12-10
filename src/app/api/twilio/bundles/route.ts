
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

// Helper to get Twilio Client from headers
const getTwilioClient = (req: NextRequest) => {
    const accountSid = req.headers.get("x-twilio-account-sid");
    const authToken = req.headers.get("x-twilio-auth-token");

    if (!accountSid || !authToken) {
        throw new Error("Missing Twilio credentials in headers");
    }

    return twilio(accountSid, authToken);
};

export async function GET(req: NextRequest) {
    try {
        const accountSid = req.headers.get("x-twilio-account-sid");
        const authToken = req.headers.get("x-twilio-auth-token");

        if (!accountSid || !authToken) {
            return NextResponse.json({ error: "Missing Twilio credentials" }, { status: 401 });
        }

        const url = new URL(req.url);
        const subAccountSid = url.searchParams.get("subAccountSid");

        console.log(`Fetching bundles for ${subAccountSid || 'Master Account'}...`);

        // If subAccountSid is provided, we act on behalf of that account
        // using the Master Credentials
        const client = subAccountSid
            ? twilio(accountSid, authToken, { accountSid: subAccountSid })
            : twilio(accountSid, authToken);

        const bundles = await client.numbers.v2.regulatoryCompliance.bundles.list({
            limit: 20,
        });

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
