import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: Request) {
    console.log("Twilio Port/List request received");
    try {
        const body = await request.json();

        let {
            action,
            accountSid,
            authToken,
            sourceAccountSid,
            targetAccountSid,
            phoneNumber,
            phoneNumberSid
        } = body;

        // Fallback to env vars if body params are missing or empty
        if (!accountSid) accountSid = process.env.TWILIO_ACCOUNT_SID;
        if (!authToken) authToken = process.env.TWILIO_AUTH_TOKEN;

        if (!accountSid || !authToken) {
            return NextResponse.json({ success: false, error: 'Missing Twilio credentials' }, { status: 401 });
        }

        const mainClient = twilio(accountSid, authToken);

        // LIST NUMBERS
        if (action === 'list') {
            if (!sourceAccountSid) return NextResponse.json({ success: false, error: 'Missing sourceAccountSid' }, { status: 400 });

            const numbers = await mainClient.api.v2010.accounts(sourceAccountSid).incomingPhoneNumbers.list({ limit: 100 });

            return NextResponse.json({
                success: true,
                numbers: numbers.map(n => ({
                    sid: n.sid,
                    phoneNumber: n.phoneNumber,
                    friendlyName: n.friendlyName
                }))
            });
        }

        // PORT NUMBER
        if (!sourceAccountSid || !targetAccountSid) {
            return NextResponse.json({ success: false, error: 'Missing sourceAccountSid or targetAccountSid' }, { status: 400 });
        }

        let sidToPort = phoneNumberSid;
        if (!sidToPort && phoneNumber) {
            const found = await mainClient.api.v2010.accounts(sourceAccountSid).incomingPhoneNumbers.list({ phoneNumber, limit: 1 });
            if (found.length === 0) return NextResponse.json({ success: false, error: `Phone number ${phoneNumber} not found` }, { status: 404 });
            sidToPort = found[0].sid;
        }

        console.log(`[Port] Moving ${sidToPort} → ${targetAccountSid}`);

        const numberDetails = await mainClient.api.v2010.accounts(sourceAccountSid).incomingPhoneNumbers(sidToPort).fetch();

        // FIXED: Parse country from E.164 phoneNumber (no extra libs)
        let countryCode = 'US'; // Default
        const phone = numberDetails.phoneNumber || '';
        if (phone.startsWith('+61')) countryCode = 'AU';
        else if (phone.startsWith('+1')) countryCode = 'US'; // Add more as needed
        console.log(`[Port] Parsed country: ${countryCode}`);

        let updatedNumber: any;
        let needsBundle = false;
        let needsAddress = false;

        // Attempt 1 – simple transfer
        try {
            updatedNumber = await mainClient.api.v2010
                .accounts(sourceAccountSid)
                .incomingPhoneNumbers(sidToPort)
                .update({ accountSid: targetAccountSid });
            console.log("[Port] Success – no regulatory requirements");
        } catch (err: any) {
            console.log(`[Port] Attempt 1 failed: ${err.code} - ${err.message}`);
            if (err.code === 21649) needsBundle = true;
            else if (err.code === 21631) needsAddress = true;
            else throw err;
        }

        // Attempt 2 – add missing regulatory items
        if (needsBundle || needsAddress) {
            const targetClient = twilio(accountSid, authToken, { accountSid: targetAccountSid });
            const params: any = { accountSid: targetAccountSid };

            if (needsAddress) {
                const addresses = await targetClient.addresses.list({ isoCountry: countryCode, limit: 20 });
                const validAddr = addresses.find(a => a.validated === true);
                if (!validAddr) return NextResponse.json({ success: false, error: `No validated address in target for ${countryCode}` }, { status: 400 });
                params.addressSid = validAddr.sid;
            }

            if (needsBundle) {
                const sourceBundleSid = numberDetails.bundleSid;
                if (!sourceBundleSid) return NextResponse.json({ success: false, error: 'Source number has no bundle' }, { status: 400 });

                // Clone source bundle → target (auto-approved)
                const cloned = await mainClient.numbers.v2
                    .bundleClone(sourceBundleSid)
                    .create({
                        targetAccountSid,
                        friendlyName: `Clone for ${numberDetails.phoneNumber}`
                    });

                params.bundleSid = cloned.bundleSid;
                console.log(`[Port] Cloned bundle ${cloned.bundleSid}`);
            }

            updatedNumber = await mainClient.api.v2010
                .accounts(sourceAccountSid)
                .incomingPhoneNumbers(sidToPort)
                .update(params);

            console.log("[Port] Success with regulatory requirements");
        }

        return NextResponse.json({
            success: true,
            data: {
                phoneNumber: updatedNumber.phoneNumber,
                sid: updatedNumber.sid,
                newAccountSid: updatedNumber.accountSid,
                friendlyName: updatedNumber.friendlyName
            }
        });

    } catch (error: any) {
        console.error("Port error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
    }
}