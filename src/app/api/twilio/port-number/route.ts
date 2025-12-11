
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
        let updateParams: any = { accountSid: targetAccountSid };
        let attempts = 0;
        const maxAttempts = 5; // Allow for a few distinct regulation hurdles

        while (attempts < maxAttempts) {
            attempts++;
            try {
                console.log(`[Port] Attempt ${attempts}: Updating SID ${sidToPort} with params:`, JSON.stringify(updateParams));

                updatedNumber = await client.api.v2010
                    .accounts(sourceAccountSid)
                    .incomingPhoneNumbers(sidToPort)
                    .update(updateParams);

                // If we get here, success!
                break;

            } catch (portError: any) {
                console.error(`[Port] Update failed on attempt ${attempts}. Code: ${portError.code}, Message: ${portError.message}`);

                // If last attempt, throw the error
                if (attempts >= maxAttempts) throw portError;

                // CASE 1: Address Requirement (Error 21631)
                if ((portError.code === 21631 || portError.message?.includes('AddressSid'))) {
                    if (updateParams.bundleSid) {
                        // If we have a bundle but still get "Address Required", the bundle is likely invalid or insufficient.
                        // We shouldn't blindly add address back.
                        console.warn('[Port] Received Address error (21631) despite having BundleSid. The Bundle might be invalid for this number.');
                        // For now, let's throw to avoid infinite loop of swapping params, or let the loop exhaust
                    }
                    else if (!updateParams.addressSid) {
                        console.warn('[Port] Missing Address (21631). Searching target account for address...');

                        const addresses = await client.api.v2010
                            .accounts(targetAccountSid)
                            .addresses
                            .list({ limit: 1 });

                        if (addresses.length > 0) {
                            const validAddressSid = addresses[0].sid;
                            console.log(`[Port] Found address ${validAddressSid}. Adding to retry params.`);
                            updateParams.addressSid = validAddressSid;
                            continue; // Retry loop
                        } else {
                            throw new Error(`Port Failed (Address Required): No addresses found on target account ${targetAccountSid}. Please create a validation address first.`);
                        }
                    }
                }
                // CASE 2: Bundle Requirement (Error 21649)
                else if ((portError.code === 21649 || portError.message?.includes('Bundle required'))) {
                    // Start Case 2 logic
                    if (updateParams.bundleSid) {
                        // We already have a bundle but got error? 
                        // Check if we are stuck
                    }

                    if (!updateParams.bundleSid) {
                        console.warn('[Port] Missing Regulatory Bundle (21649). Searching target account for approved bundles...');

                        // Instantiate client scoped to target subaccount to find its bundles
                        const subAccountClient = twilio(accountSid, authToken, { accountSid: targetAccountSid });

                        // Fetch "twilio-approved" bundles
                        const bundles = await subAccountClient.numbers.v2.regulatoryCompliance.bundles.list({
                            status: 'twilio-approved',
                            limit: 1
                        });

                        if (bundles.length > 0) {
                            const validBundleSid = bundles[0].sid;
                            console.log(`[Port] Found approved bundle ${validBundleSid} (${bundles[0].friendlyName}). Adding to retry params.`);

                            // Critical: Remove AddressSid if we are providing a BundleSid to avoid conflicts.
                            if (updateParams.addressSid) {
                                console.log('[Port] Removing colliding AddressSid in favor of BundleSid.');
                                delete updateParams.addressSid;
                            }
                            updateParams.bundleSid = validBundleSid;

                            continue; // Retry loop
                        } else {
                            throw new Error(`Port Failed (Bundle Required): No 'twilio-approved' regulatory bundles found on target account ${targetAccountSid}. Please ensure you have a bundle with status 'Twilio Approved'.`);
                        }
                    }
                }
                else {
                    // Unknown error or we already tried fixing this param and it failed again
                    // Rethrow to exit
                    throw portError;
                }
            }
        }

        if (!updatedNumber) {
            throw new Error("Port failed: Unable to complete number update after multiple attempts.");
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
