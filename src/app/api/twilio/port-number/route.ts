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

        // DIAGNOSTIC: Verify who we are authenticated as
        let authenticatedAccount;
        try {
            authenticatedAccount = await client.api.v2010.accounts(accountSid).fetch();
            console.log(`[Auth] Authenticated as: ${authenticatedAccount.friendlyName} (${authenticatedAccount.sid})`);

            if (sourceAccountSid && authenticatedAccount.sid === sourceAccountSid) {
                console.warn("[Auth] WARNING: You are authenticated as the SOURCE Subaccount. Moving numbers between subaccounts requires MASTER credentials.");
            }
        } catch (authErr) {
            console.error("[Auth] Failed to verify authenticated account:", authErr);
        }

        // ACTION: LIST NUMBERS
        if (action === 'list') {
            if (!sourceAccountSid) {
                return NextResponse.json(
                    { success: false, error: 'Missing sourceAccountSid' },
                    { status: 400 }
                );
            }

            console.log(`Listing numbers for account ${sourceAccountSid} using credentials for ${accountSid}`);
            try {
                const numbers = await client.api.v2010
                    .accounts(sourceAccountSid)
                    .incomingPhoneNumbers
                    .list({ limit: 100 });

                const formattedNumbers = numbers.map(n => ({
                    sid: n.sid,
                    phoneNumber: n.phoneNumber,
                    friendlyName: n.friendlyName
                }));

                console.log(`Found ${formattedNumbers.length} numbers.`);

                return NextResponse.json({
                    success: true,
                    numbers: formattedNumbers
                });
            } catch (error: any) {
                console.error("Error listing numbers:", error);

                let errorMessage = `Failed to list numbers: ${error.message}`;
                if (error.status === 404) {
                    errorMessage += ". (Hint: Ensure the Source Account SID is a valid subaccount of your configured Master Account SID.)";
                }

                return NextResponse.json(
                    { success: false, error: errorMessage },
                    { status: error.status || 500 }
                );
            }
        }

        // ACTION: PORT NUMBER (Default)
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

        // Pre-fetch number details for intelligent filtering
        let targetCountryCode: string | undefined;
        let numberType: string | undefined;

        try {
            const numberDetails = await client.api.v2010
                .accounts(sourceAccountSid)
                .incomingPhoneNumbers(sidToPort)
                .fetch();

            const nd = numberDetails as any;
            if (nd.countryCode) {
                targetCountryCode = nd.countryCode;
            } else if (numberDetails.phoneNumber) {
                // Fallback: Infer from prefix
                if (numberDetails.phoneNumber.startsWith('+61')) targetCountryCode = 'AU';
                else if (numberDetails.phoneNumber.startsWith('+1')) targetCountryCode = 'US';
                else if (numberDetails.phoneNumber.startsWith('+44')) targetCountryCode = 'GB';
            }

            // Determine number type (mobile, local, toll-free)
            const capabilities = numberDetails.capabilities;
            if (capabilities?.mms || capabilities?.sms) {
                numberType = 'mobile';
            } else {
                numberType = 'local';
            }

            if (targetCountryCode) {
                console.log(`[Port] Target Number Country: ${targetCountryCode}, Type: ${numberType}`);
            }
        } catch (detailsErr) {
            console.warn(`[Port] Failed to fetch details for number ${sidToPort}, defaulting to broader search.`, detailsErr);
        }

        // =======================================================================
        // CRITICAL FIX: Bundles and Addresses are SCOPED to specific accounts.
        // When transferring numbers between subaccounts, we have TWO approaches:
        //
        // APPROACH 1 (Simple): Just transfer with accountSid only
        // - Let Twilio automatically match against target account's bundles
        // - Works if target account has at least one approved bundle for that country/type
        //
        // APPROACH 2 (Advanced): Clone the bundle from target to source, then transfer
        // - Use Bundle Clone API to copy approved bundle
        // - More complex but gives explicit control
        // =======================================================================

        let updatedNumber;
        let updateParams: any = { accountSid: targetAccountSid };
        let attempts = 0;
        const maxAttempts = 3; // Reduced attempts since we're not doing incremental resolution

        while (attempts < maxAttempts) {
            attempts++;
            try {
                console.log(`[Port] Attempt ${attempts}: Updating SID ${sidToPort} with params:`, JSON.stringify(updateParams));

                updatedNumber = await client.api.v2010
                    .accounts(sourceAccountSid)
                    .incomingPhoneNumbers(sidToPort)
                    .update(updateParams);

                // If we get here, success!
                console.log(`[Port] ✅ Successfully transferred number on attempt ${attempts}`);
                break;

            } catch (portError: any) {
                console.error(`[Port] Update failed on attempt ${attempts}. Code: ${portError.code}, Message: ${portError.message}`);

                // If last attempt, throw the error
                if (attempts >= maxAttempts) {
                    // Provide helpful error message
                    if (portError.code === 21631) {
                        throw new Error(
                            `Transfer failed: Target account ${targetAccountSid} needs an Address resource for ${targetCountryCode || 'this country'}. ` +
                            `Create an address in the target account via: https://www.twilio.com/console/phone-numbers/verified-caller-ids`
                        );
                    } else if (portError.code === 21649) {
                        throw new Error(
                            `Transfer failed: Target account ${targetAccountSid} needs a Regulatory Bundle for ${targetCountryCode || 'this country'} ${numberType || 'mobile'} numbers. ` +
                            `Create and approve a bundle first, or use the Bundle Manager tool.`
                        );
                    }
                    throw portError;
                }

                // CASE 1: Address Requirement (Error 21631)
                if (portError.code === 21631 || portError.message?.includes('AddressSid')) {
                    console.warn(`[Port] Missing Address (21631). Looking for existing addresses in TARGET account...`);

                    try {
                        // Use target account credentials to find existing addresses
                        const targetClient = twilio(accountSid, authToken, { accountSid: targetAccountSid });

                        // First, try to find existing validated addresses for this country
                        const addressListParams: any = { limit: 20 };
                        if (targetCountryCode) {
                            addressListParams.isoCountry = targetCountryCode;
                        }

                        const existingAddresses = await targetClient.addresses.list(addressListParams);

                        // Filter for validated addresses
                        const validatedAddresses = existingAddresses.filter((addr: any) =>
                            addr.validated === true || addr.validated === 'true'
                        );

                        if (validatedAddresses.length > 0) {
                            // Reuse existing validated address (prevents duplicates!)
                            const addressToUse = validatedAddresses[0];
                            console.log(`[Port] ✅ Found existing validated address ${addressToUse.sid} (${addressToUse.customerName})`);
                            console.log(`[Port] Reusing address to prevent duplicates`);

                            updateParams.addressSid = addressToUse.sid;
                            continue; // Retry the transfer
                        } else {
                            // No validated addresses exist - create one
                            console.log(`[Port] No validated addresses found. Creating new address...`);

                            const newAddress = await targetClient.addresses.create({
                                customerName: 'Business Address',
                                street: targetCountryCode === 'AU' ? '50a Habitat Way' : '1 Market Street',
                                city: targetCountryCode === 'AU' ? 'Lennox Head' : 'San Francisco',
                                region: targetCountryCode === 'AU' ? 'NSW' : 'CA',
                                postalCode: targetCountryCode === 'AU' ? '2478' : '94102',
                                isoCountry: targetCountryCode || 'AU',
                                emergencyEnabled: false
                            });

                            console.log(`[Port] Created new Address ${newAddress.sid} in target account`);

                            updateParams.addressSid = newAddress.sid;
                            continue; // Retry the transfer
                        }
                    } catch (addrErr: any) {
                        console.error(`[Port] Failed to handle address:`, addrErr);
                        throw new Error(
                            `Failed to find or create address in target account: ${addrErr.message}. ` +
                            `Please create an address manually in account ${targetAccountSid}.`
                        );
                    }
                }
                // CASE 2: Bundle Requirement (Error 21649)
                else if (portError.code === 21649 || portError.message?.includes('Bundle required')) {
                    console.error(
                        `[Port] Bundle Required (21649). Target account ${targetAccountSid} needs an approved regulatory bundle for ` +
                        `${targetCountryCode || 'this country'} ${numberType || 'mobile'} numbers.`
                    );

                    // OPTION A: Check if target has ANY approved bundles
                    try {
                        const targetClient = twilio(accountSid, authToken, { accountSid: targetAccountSid });

                        const bundles = await targetClient.numbers.v2.regulatoryCompliance.bundles.list({
                            status: 'twilio-approved',
                            isoCountry: targetCountryCode,
                            limit: 1
                        });

                        if (bundles.length > 0) {
                            const bundleSid = bundles[0].sid;
                            console.log(`[Port] Found approved bundle ${bundleSid} in target account, but cannot directly reference it.`);
                            console.log(`[Port] Twilio should auto-match this bundle. The issue may be that the bundle doesn't match the number type.`);
                        }
                    } catch (bundleCheckErr) {
                        console.warn(`[Port] Could not check for bundles:`, bundleCheckErr);
                    }

                    throw new Error(
                        `Target account ${targetAccountSid} needs a 'twilio-approved' regulatory bundle for ` +
                        `${targetCountryCode || 'AU'} ${numberType || 'mobile'} numbers. ` +
                        `\n\nSteps to fix:\n` +
                        `1. Create a bundle in the TARGET account (${targetAccountSid})\n` +
                        `2. Ensure bundle is for country: ${targetCountryCode}, number type: ${numberType}\n` +
                        `3. Wait for bundle to be approved (status: 'twilio-approved')\n` +
                        `4. Then retry the transfer\n\n` +
                        `Use the Bundle Manager tool or Twilio Console to create the bundle.`
                    );
                }
                else {
                    // Unknown error, rethrow
                    throw portError;
                }
            }
        }

        if (!updatedNumber) {
            throw new Error("Port failed: Unable to complete number update after multiple attempts.");
        }

        console.log(`✅ Successfully ported number ${updatedNumber.phoneNumber} to ${targetAccountSid}`);

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