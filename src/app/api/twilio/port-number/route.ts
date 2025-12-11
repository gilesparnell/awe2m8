
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
        // Update the Phone Number resource
        let updatedNumber;
        try {
            updatedNumber = await client.api.v2010
                .accounts(sourceAccountSid)
                .incomingPhoneNumbers(sidToPort)
                .update({ accountSid: targetAccountSid });
        } catch (portError: any) {
            // Handle Address Requirement (Error 21631)
            // "Phone Number Requires an Address but the 'AddressSid' parameter was empty."
            if (portError.code === 21631 || portError.message?.includes('AddressSid')) {
                console.warn('Port failed due to missing Address (21631). Attempting to find a valid address on target account...');

                // 1. Fetch addresses from TARGET account
                const addresses = await client.api.v2010
                    .accounts(targetAccountSid)
                    .addresses
                    .list({ limit: 1 });

                if (addresses.length > 0) {
                    const validAddressSid = addresses[0].sid;
                    console.log(`Found address ${validAddressSid} on target account. Retrying port...`);

                    // 2. Retry Update WITH AddressSid
                    updatedNumber = await client.api.v2010
                        .accounts(sourceAccountSid)
                        .incomingPhoneNumbers(sidToPort)
                        .update({
                            accountSid: targetAccountSid,
                            addressSid: validAddressSid
                        });
                } else {
                    throw new Error(`Port Failed: The phone number requires a valid Address on the target account (Error 21631), but no addresses were found on account ${targetAccountSid}. Please create an address on the target subaccount first.`);
                }
            } else {
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
