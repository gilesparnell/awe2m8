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
        let sourceBundleSid: string | undefined;

        try {
            const numberDetails = await client.api.v2010
                .accounts(sourceAccountSid)
                .incomingPhoneNumbers(sidToPort)
                .fetch();

            const nd = numberDetails as any;

            // Get the bundle SID from the source number
            sourceBundleSid = nd.bundleSid;

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

            console.log(`[Port] Source Number Details: Country=${targetCountryCode}, Type=${numberType}, BundleSID=${sourceBundleSid}`);
        } catch (detailsErr) {
            console.warn(`[Port] Failed to fetch details for number ${sidToPort}`, detailsErr);
        }

        // =======================================================================
        // CLONE BUNDLE TO TARGET ACCOUNT IF NEEDED
        // =======================================================================
        let targetBundleSid: string | undefined;
        let validatedAddressSid: string | undefined;

        try {
            const targetClient = twilio(accountSid, authToken, { accountSid: targetAccountSid });

            // First, check if there's already an approved bundle in the target account
            console.log(`[Port] Checking for existing approved bundle in target account for ${targetCountryCode} ${numberType}...`);
            const existingBundles = await targetClient.numbers.v2.regulatoryCompliance.bundles.list({
                status: 'twilio-approved',
                isoCountry: targetCountryCode,
                numberType: numberType,
                limit: 10
            });

            if (existingBundles.length > 0) {
                targetBundleSid = existingBundles[0].sid;
                console.log(`[Port] ✅ Found existing approved bundle in target: ${targetBundleSid}`);
            } else if (sourceBundleSid) {
                // No existing bundle - clone from source
                console.log(`[Port] No existing bundle found. Cloning bundle ${sourceBundleSid} from source to target account...`);

                try {
                    // Use master account credentials to clone the bundle
                    const masterClient = twilio(accountSid, authToken);

                    // Clone the bundle to the target account using the master account
                    const clonedBundle = await masterClient.numbers.v2.regulatoryCompliance.bundles(sourceBundleSid).bundleCopies.create({
                        targetAccountSid: targetAccountSid,
                        friendlyName: `Cloned from ${sourceAccountSid} for number transfer`
                    });

                    targetBundleSid = clonedBundle.sid;
                    console.log(`[Port] ✅ Successfully cloned bundle to target account: ${targetBundleSid}`);

                    // The cloned bundle is automatically approved, so we can use it immediately
                } catch (cloneErr: any) {
                    console.error(`[Port] Failed to clone bundle:`, cloneErr);
                    throw new Error(
                        `Failed to clone regulatory bundle: ${cloneErr.message}. ` +
                        `The source number has bundle ${sourceBundleSid} but it couldn't be cloned to the target account. ` +
                        `You may need to manually create a bundle in the target account.`
                    );
                }
            } else {
                console.warn(`[Port] ⚠️  No bundle found in source or target account for ${targetCountryCode} ${numberType}`);
            }

            // Find validated address in target account
            console.log(`[Port] Pre-fetching validated address for ${targetCountryCode}...`);
            const addresses = await targetClient.addresses.list({
                isoCountry: targetCountryCode,
                limit: 20
            });

            const validatedAddresses = addresses.filter((addr: any) =>
                addr.validated === true || addr.validated === 'true'
            );

            if (validatedAddresses.length > 0) {
                validatedAddressSid = validatedAddresses[0].sid;
                console.log(`[Port] ✅ Found validated address: ${validatedAddressSid}`);
            } else {
                console.warn(`[Port] ⚠️  No validated address found for ${targetCountryCode}`);
            }

        } catch (prefetchErr) {
            console.warn(`[Port] Warning during pre-fetch/clone:`, prefetchErr);
        }

        // =======================================================================
        // PERFORM THE NUMBER TRANSFER
        // =======================================================================
        let updatedNumber;
        let updateParams: any = {
            accountSid: targetAccountSid,
            ...(validatedAddressSid && { addressSid: validatedAddressSid }),
            ...(targetBundleSid && { bundleSid: targetBundleSid })
        };
        let attempts = 0;
        const maxAttempts = 3;

        console.log(`[Port] Starting transfer with params:`, JSON.stringify(updateParams));

        while (attempts < maxAttempts) {
            attempts++;
            try {
                console.log(`[Port] Attempt ${attempts}: Updating SID ${sidToPort}`);

                updatedNumber = await client.api.v2010
                    .accounts(sourceAccountSid)
                    .incomingPhoneNumbers(sidToPort)
                    .update(updateParams);

                console.log(`[Port] ✅ Successfully transferred number on attempt ${attempts}`);
                break;

            } catch (portError: any) {
                console.error(`[Port] Update failed on attempt ${attempts}. Code: ${portError.code}, Message: ${portError.message}`);

                if (attempts >= maxAttempts) {
                    if (portError.code === 21631) {
                        throw new Error(
                            `Transfer failed: Target account ${targetAccountSid} needs an Address resource for ${targetCountryCode || 'this country'}. ` +
                            `Create an address in the target account via: https://www.twilio.com/console/phone-numbers/verified-caller-ids`
                        );
                    } else if (portError.code === 21649) {
                        throw new Error(
                            `Target account ${targetAccountSid} needs a 'twilio-approved' regulatory bundle for ` +
                            `${targetCountryCode || 'AU'} ${numberType || 'mobile'} numbers. ` +
                            `\n\nSteps to fix:\n` +
                            `1. Create a bundle in the TARGET account (${targetAccountSid})\n` +
                            `2. Ensure bundle is for country: ${targetCountryCode}, number type: ${numberType}\n` +
                            `3. Wait for bundle to be approved (status: 'twilio-approved')\n` +
                            `4. Then retry the transfer\n\n` +
                            `Alternatively, ensure the source number has a bundle that can be cloned.`
                        );
                    }
                    throw portError;
                }

                // Handle missing address
                if (portError.code === 21631 || portError.message?.includes('AddressSid')) {
                    console.warn(`[Port] Missing Address (21631). Creating address in TARGET account...`);

                    try {
                        const targetClient = twilio(accountSid, authToken, { accountSid: targetAccountSid });
                        const addressListParams: any = { limit: 20 };
                        if (targetCountryCode) {
                            addressListParams.isoCountry = targetCountryCode;
                        }

                        const existingAddresses = await targetClient.addresses.list(addressListParams);
                        const validatedAddresses = existingAddresses.filter((addr: any) =>
                            addr.validated === true || addr.validated === 'true'
                        );

                        if (validatedAddresses.length > 0) {
                            const addressToUse = validatedAddresses[0];
                            console.log(`[Port] ✅ Found existing validated address ${addressToUse.sid}`);
                            updateParams.addressSid = addressToUse.sid;
                            continue;
                        } else {
                            console.log(`[Port] Creating new address...`);
                            const newAddress = await targetClient.addresses.create({
                                customerName: 'Business Address',
                                street: targetCountryCode === 'AU' ? '50a Habitat Way' : '1 Market Street',
                                city: targetCountryCode === 'AU' ? 'Lennox Head' : 'San Francisco',
                                region: targetCountryCode === 'AU' ? 'NSW' : 'CA',
                                postalCode: targetCountryCode === 'AU' ? '2478' : '94102',
                                isoCountry: targetCountryCode || 'AU',
                                emergencyEnabled: false
                            });
                            console.log(`[Port] Created new Address ${newAddress.sid}`);
                            updateParams.addressSid = newAddress.sid;
                            continue;
                        }
                    } catch (addrErr: any) {
                        console.error(`[Port] Failed to handle address:`, addrErr);
                        throw new Error(
                            `Failed to find or create address: ${addrErr.message}. ` +
                            `Please create an address manually in account ${targetAccountSid}.`
                        );
                    }
                }
                // Handle missing bundle on retry
                else if (portError.code === 21649 || portError.message?.includes('Bundle')) {
                    console.error(`[Port] Bundle error on retry. This shouldn't happen after cloning.`);
                    throw portError;
                }
                else {
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
                friendlyName: updatedNumber.friendlyName,
                bundleSid: targetBundleSid,
                addressSid: validatedAddressSid
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