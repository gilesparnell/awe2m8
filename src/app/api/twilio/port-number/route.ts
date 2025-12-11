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

        // Allow Env Vars Fallback
        if (!accountSid || !authToken) {
            accountSid = process.env.TWILIO_ACCOUNT_SID;
            authToken = process.env.TWILIO_AUTH_TOKEN;
        }

        if (!accountSid || !authToken) {
            return NextResponse.json(
                { success: false, error: 'Missing Twilio credentials' },
                { status: 401 }
            );
        }

        // CRITICAL: Main client for API calls
        const mainClient = twilio(accountSid, authToken);

        // ACTION: LIST NUMBERS
        if (action === 'list') {
            if (!sourceAccountSid) {
                return NextResponse.json(
                    { success: false, error: 'Missing sourceAccountSid' },
                    { status: 400 }
                );
            }

            const numbers = await mainClient.api.v2010
                .accounts(sourceAccountSid)
                .incomingPhoneNumbers
                .list({ limit: 100 });

            return NextResponse.json({
                success: true,
                numbers: numbers.map(n => ({
                    sid: n.sid,
                    phoneNumber: n.phoneNumber,
                    friendlyName: n.friendlyName
                }))
            });
        }

        // ACTION: PORT NUMBER
        if (!sourceAccountSid || !targetAccountSid) {
            return NextResponse.json(
                { success: false, error: 'Missing sourceAccountSid or targetAccountSid' },
                { status: 400 }
            );
        }

        let sidToPort = phoneNumberSid;

        // Look up SID if only phone number provided
        if (!sidToPort && phoneNumber) {
            const numbers = await mainClient.api.v2010
                .accounts(sourceAccountSid)
                .incomingPhoneNumbers
                .list({ phoneNumber, limit: 1 });

            if (numbers.length === 0) {
                return NextResponse.json(
                    { success: false, error: `Phone number ${phoneNumber} not found` },
                    { status: 404 }
                );
            }
            sidToPort = numbers[0].sid;
        }

        console.log(`[Port] Porting ${sidToPort} from ${sourceAccountSid} to ${targetAccountSid}`);

        // Get number details to determine requirements
        const numberDetails = await mainClient.api.v2010
            .accounts(sourceAccountSid)
            .incomingPhoneNumbers(sidToPort)
            .fetch();

        const country = numberDetails.isoCountry;
        console.log(`[Port] Number country: ${country}`);

        // CRITICAL INSIGHT: Don't try to pass bundle/address on first attempt
        // Let Twilio tell us what's needed, THEN get resources from target account

        let updatedNumber;
        let retryWithBundle = false;
        let retryWithAddress = false;

        // ATTEMPT 1: Transfer with only accountSid
        try {
            console.log(`[Port] Attempt 1: Transfer with accountSid only`);
            updatedNumber = await mainClient.api.v2010
                .accounts(sourceAccountSid)
                .incomingPhoneNumbers(sidToPort)
                .update({ accountSid: targetAccountSid });

            console.log(`[Port] ✅ Transfer successful without regulatory requirements!`);

        } catch (error: any) {
            console.log(`[Port] Attempt 1 failed: ${error.code} - ${error.message}`);

            if (error.code === 21649) {
                retryWithBundle = true;
            } else if (error.code === 21631) {
                retryWithAddress = true;
            } else {
                throw error;
            }
        }

        // ATTEMPT 2: If regulatory requirements needed, get them from TARGET account
        if (retryWithBundle || retryWithAddress) {
            console.log(`[Port] Regulatory requirements needed. Fetching from target account...`);

            // Create a client scoped to the TARGET account to fetch its resources
            const targetClient = twilio(accountSid, authToken, { accountSid: targetAccountSid });

            const updateParams: any = {
                accountSid: targetAccountSid
            };

            // Get address from target account if needed
            if (retryWithAddress) {
                console.log(`[Port] Looking for address in target account...`);
                const addresses = await targetClient.addresses.list({
                    isoCountry: country,
                    limit: 20
                });

                const validAddress = addresses.find((addr: any) =>
                    addr.validated === true || addr.validated === 'true'
                );

                if (!validAddress) {
                    return NextResponse.json({
                        success: false,
                        error: `No validated address found in target account for country ${country}. ` +
                            `Please create an address in account ${targetAccountSid} first.`
                    }, { status: 400 });
                }

                updateParams.addressSid = validAddress.sid;
                console.log(`[Port] ✅ Found address: ${validAddress.sid}`);
            }

            // Get bundle from target account if needed
            if (retryWithBundle) {
                console.log(`[Port] Looking for approved bundle in target account...`);

                // Determine number type
                const capabilities = numberDetails.capabilities;
                let numberType = 'local';
                if (capabilities?.mms || capabilities?.sms) {
                    numberType = 'mobile';
                }

                const bundles = await targetClient.numbers.v2.regulatoryCompliance.bundles.list({
                    isoCountry: country,
                    numberType: numberType,
                    status: 'twilio-approved',
                    limit: 20
                });

                if (bundles.length === 0) {
                    return NextResponse.json({
                        success: false,
                        error: `No approved bundle found in target account for ${country} ${numberType} numbers. ` +
                            `Please create and approve a bundle in account ${targetAccountSid} first.`
                    }, { status: 400 });
                }

                updateParams.bundleSid = bundles[0].sid;
                console.log(`[Port] ✅ Found bundle: ${bundles[0].sid}`);
            }

            // ATTEMPT 2: Transfer with bundle/address from target account
            console.log(`[Port] Attempt 2: Transfer with regulatory requirements`);
            console.log(`[Port] Params:`, JSON.stringify(updateParams));

            updatedNumber = await mainClient.api.v2010
                .accounts(sourceAccountSid)
                .incomingPhoneNumbers(sidToPort)
                .update(updateParams);

            console.log(`[Port] ✅ Transfer successful with regulatory requirements!`);
        }

        return NextResponse.json({
            success: true,
            data: {
                phoneNumber: updatedNumber!.phoneNumber,
                sid: updatedNumber!.sid,
                newAccountSid: updatedNumber!.accountSid,
                friendlyName: updatedNumber!.friendlyName
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