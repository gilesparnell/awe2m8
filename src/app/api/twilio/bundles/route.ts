
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
        const client = getTwilioClient(req);

        const bundles = await client.numbers.v2.regulatoryCompliance.bundles.list({
            limit: 20,
        });

        return NextResponse.json({ results: bundles });
    } catch (error: any) {
        console.error("Twilio API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch bundles" },
            { status: 500 }
        );
    }
}
