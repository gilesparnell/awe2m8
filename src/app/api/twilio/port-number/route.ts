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

        // Parse country from E.164 phoneNumber
        let countryCode = 'US';
        let numberType = 'local';
        const phone = numberDetails.phoneNumber || '';
        if (phone.startsWith('+61')) {
            countryCode = 'AU';
            if (phone.startsWith('+614')) numberType = 'mobile';
        } else if (phone.startsWith('+1')) {
            countryCode = 'US';
        }
        console.log(`[Port] Parsed country: ${countryCode}, type: ${numberType}`);

        let updatedNumber: any;

        // Attempt 1 – simple transfer
        try {
            updatedNumber = await mainClient.api.v2010
                .accounts(sourceAccountSid)
                .incomingPhoneNumbers(sidToPort)
                .update({ accountSid: targetAccountSid });
            console.log("[Port] Success – no regulatory requirements");
        } catch (err: any) {
            console.log(`[Port] Attempt 1 failed: ${err.code} - ${err.message}`);

            // For AU numbers, we need BOTH bundle AND address
            if (err.code === 21649 || err.code === 21631) {
                console.log(`[Port] Regulatory requirement detected. Fetching resources from target account...`);

                // Get target account's own auth token for proper API access
                const targetAccountDetails = await mainClient.api.v2010.accounts(targetAccountSid).fetch();
                const targetClient = twilio(targetAccountSid, targetAccountDetails.authToken);

                // Fetch ALL approved bundles for the country
                const bundles = await targetClient.numbers.v2.regulatoryCompliance.bundles.list({
                    status: 'twilio-approved',
                    isoCountry: countryCode
                });

                console.log(`[Port] Found ${bundles.length} approved bundles in target account`);

                if (bundles.length === 0) {
                    return NextResponse.json({
                        success: false,
                        error: `Target account has no approved regulatory bundles for ${countryCode}. Please create and approve a bundle first.`
                    }, { status: 400 });
                }

                // Fetch ALL addresses for the country
                const addresses = await targetClient.addresses.list({ isoCountry: countryCode });

                console.log(`[Port] Found ${addresses.length} addresses in target account`);

                if (addresses.length === 0) {
                    // Create a default address
                    console.log(`[Port] No addresses found. Creating default address...`);
                    const newAddr = await targetClient.addresses.create({
                        customerName: 'AWE2M8 Porting',
                        street: '50a Habitat Way',
                        city: 'Lennox Head',
                        region: 'NSW',
                        postalCode: '2478',
                        isoCountry: 'AU'
                    });
                    addresses.push(newAddr);
                }

                // NESTED ITERATION: Try all Bundle + Address combinations
                let portSuccess = false;

                bundleLoop:
                for (const bundle of bundles) {
                    console.log(`[Port] Trying bundle: ${bundle.sid}`);

                    for (const addr of addresses) {
                        console.log(`[Port]   Trying address: ${addr.sid}`);

                        try {
                            updatedNumber = await mainClient.api.v2010
                                .accounts(sourceAccountSid)
                                .incomingPhoneNumbers(sidToPort)
                                .update({
                                    accountSid: targetAccountSid,
                                    bundleSid: bundle.sid,
                                    addressSid: addr.sid
                                });

                            console.log(`[Port] ✅ SUCCESS with bundle ${bundle.sid} + address ${addr.sid}`);
                            portSuccess = true;
                            break bundleLoop;

                        } catch (innerErr: any) {
                            if (innerErr.code === 21651) {
                                // Address not in bundle - try next address
                                console.log(`[Port]   Address mismatch (21651), trying next...`);
                                continue;
                            } else if (innerErr.code === 21649) {
                                // Bundle rejected - try next bundle
                                console.log(`[Port]   Bundle rejected (21649), trying next bundle...`);
                                break;
                            } else {
                                // Unknown error - log but continue trying
                                console.log(`[Port]   Error ${innerErr.code}: ${innerErr.message}`);
                            }
                        }
                    }
                }

                if (!portSuccess) {
                    return NextResponse.json({
                        success: false,
                        error: `Failed to port number. Tried ${bundles.length} bundles and ${addresses.length} addresses but none worked. Ensure target account has a valid bundle for ${countryCode} ${numberType} numbers.`
                    }, { status: 400 });
                }
            } else {
                // Different error - throw it
                throw err;
            }
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