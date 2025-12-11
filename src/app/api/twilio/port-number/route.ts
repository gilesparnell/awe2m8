
import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: Request) {
    console.log("Twilio Port/List request received");
    try {
        const body = await request.json();
        let {
            action, // 'list' or 'port'
            accountSid,
            authToken,
            sourceAccountSid,
            targetAccountSid,
            phoneNumber,
            phoneNumberSid
        } = body;

        // Allow Env Vars Fallback
        if (!accountSid || !authToken) {
            accountSid = process.env.TWILIO_ACCOUNT_SID;
            authToken = process.env.TWILIO_AUTH_TOKEN;
        }

        if (!accountSid || !authToken) {
            return NextResponse.json(
                { success: false, error: 'Missing Twilio credentials. Set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN env vars or provide them in request.' },
                { status: 401 }
            );
        }

        const client = twilio(accountSid, authToken);

        // ACTION: LIST NUMBERS
        if (action === 'list') {
            if (!sourceAccountSid) {
                return NextResponse.json(
                    { success: false, error: 'Missing sourceAccountSid' },
                    { status: 400 }
                );
            }

            console.log(`Listing numbers for account ${sourceAccountSid}`);
            try {
                const numbers = await client.api.v2010
                    .accounts(sourceAccountSid)
                    .incomingPhoneNumbers
                    .list({ limit: 100 }); // Limit to 100 for now to prevent massive payloads

                const formattedNumbers = numbers.map(n => ({
                    sid: n.sid,
                    phoneNumber: n.phoneNumber,
                    friendlyName: n.friendlyName
                }));

                return NextResponse.json({
                    success: true,
                    numbers: formattedNumbers
                });
            } catch (error: any) {
                console.error("Error listing numbers:", error);
                return NextResponse.json(
                    { success: false, error: `Failed to list numbers: ${error.message}` },
                    { status: 500 }
                );
            }
        }

        // ACTION: PORT NUMBER (Default)
        // We use 'port' explicitly or fall through if no action provided (backward compat)
        console.log("Parameters:", { sourceAccountSid, targetAccountSid, phoneNumber, phoneNumberSid });

        if (!sourceAccountSid || !targetAccountSid) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters: sourceAccountSid, targetAccountSid' },
                { status: 400 }
            );
        }

        let sidToPort = phoneNumberSid;

        // If no SID provided, look it up by phone number string
        if (!sidToPort) {
            if (!phoneNumber) {
                return NextResponse.json(
                    { success: false, error: 'Must provide either phoneNumberSid or phoneNumber' },
                    { status: 400 }
                );
            }
            console.log(`Looking up number ${phoneNumber} in account ${sourceAccountSid}`);
            const numbers = await client.api.v2010
                .accounts(sourceAccountSid)
                .incomingPhoneNumbers
                .list({ phoneNumber: phoneNumber, limit: 1 });

            if (numbers.length === 0) {
                return NextResponse.json(
                    { success: false, error: `Phone number ${phoneNumber} not found in account ${sourceAccountSid}` },
                    { status: 404 }
                );
            }
            sidToPort = numbers[0].sid;
        }

        console.log(`Porting Number SID: ${sidToPort} to ${targetAccountSid}`);

        // Update the Phone Number resource
        let updatedNumber;
        try {
            console.log(`[Port] Attempting initial update for SID: ${sidToPort} to Account: ${targetAccountSid}`);
            updatedNumber = await client.api.v2010
                .accounts(sourceAccountSid)
                .incomingPhoneNumbers(sidToPort)
                .update({ accountSid: targetAccountSid });
        } catch (portError: any) {
            console.error(`[Port] Initial update failed. Code: ${portError.code}, Message: ${portError.message}`);

            // CASE 1: Address Requirement (Error 21631)
            if (portError.code === 21631 || portError.message?.includes('AddressSid')) {
                console.warn('[Port] Missing Address (21631). searching target account for address...');

                const addresses = await client.api.v2010
                    .accounts(targetAccountSid)
                    .addresses
                    .list({ limit: 1 });

                if (addresses.length > 0) {
                    const validAddressSid = addresses[0].sid;
                    console.log(`[Port] Found address ${validAddressSid}. Retrying...`);

                    updatedNumber = await client.api.v2010
                        .accounts(sourceAccountSid)
                        .incomingPhoneNumbers(sidToPort)
                        .update({
                            accountSid: targetAccountSid,
                            addressSid: validAddressSid
                        });
                } else {
                    throw new Error(`Port Failed (Address Required): No addresses found on target account ${targetAccountSid}. Please create a validation address first.`);
                }
            }
            // CASE 2: Bundle Requirement (Error 21649 or textual match)
            else if (portError.code === 21649 || portError.message?.includes('Bundle required')) {
                console.warn('[Port] Missing Regulatory Bundle. Searching target account for approved bundles...');

                // We need to act as the Master Account but query the Subaccount's bundles
                // Note: 'client' is initialized with Master Credentials. 
                // To list bundles FOR the subaccount, we can pass { accountSid: targetAccountSid } to the twilio constructor
                // OR use the existing client if we can scope it. 
                // The 'numbers.v2' API is global but we need to see bundles owned by the subaccount.
                // The safest way is to instantiate a client for that subaccount.

                // We use the Master Auth Token, but act on the Subaccount
                const subAccountClient = twilio(accountSid, authToken, { accountSid: targetAccountSid });

                const bundles = await subAccountClient.numbers.v2.regulatoryCompliance.bundles.list({
                    status: 'twilio-approved',
                    limit: 1,
                    // validUntilDate: check for not expired? Usually status='twilio-approved' is enough.
                });

                if (bundles.length > 0) {
                    const validBundleSid = bundles[0].sid;
                    console.log(`[Port] Found approved bundle ${validBundleSid} (${bundles[0].friendlyName}). Retrying...`);

                    updatedNumber = await client.api.v2010
                        .accounts(sourceAccountSid)
                        .incomingPhoneNumbers(sidToPort)
                        .update({
                            accountSid: targetAccountSid,
                            bundleSid: validBundleSid
                        });
                } else {
                    throw new Error(`Port Failed (Bundle Required): No approved regulatory bundles found on target account ${targetAccountSid}. Please create and approve a bundle first.`);
                }
            }
            else {
                // Unknown error, rethrow
                throw portError;
            }
        }

        console.log(`Successfully ported number ${updatedNumber.phoneNumber} to ${targetAccountSid}`);

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
        console.error("Error processing request:", error);
        return NextResponse.json(
            { success: false, error: error.message || 'An unknown error occurred' },
            { status: 500 }
        );
    }
}
