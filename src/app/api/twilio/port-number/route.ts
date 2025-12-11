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
        // PRE-FETCH BUNDLE AND ADDRESS
        // Explicitly find approved bundle and address in target account
        // =======================================================================

        let approvedBundleSid: string | undefined;
        let validatedAddressSid: string | undefined;

        try {
            const targetClient = twilio(accountSid, authToken, { accountSid: targetAccountSid });

            // Find approved bundle - FILTER BY BOTH COUNTRY AND NUMBER TYPE
            console.log(`[Port] Pre-fetching approved bundle for ${targetCountryCode} ${numberType}...`);
            const bundleListParams: any = {
                status: 'twilio-approved',
                limit: 10
            };

            if (targetCountryCode) {
                bundleListParams.isoCountry = targetCountryCode;
            }
            if (numberType) {
                bundleListParams.numberType = numberType;
            }

            const bundles = await targetClient.numbers.v2.regulatoryCompliance.bundles.list(bundleListParams);

            if (bundles.length > 0) {
                approvedBundleSid = bundles[0].sid;
                console.log(`[Port] ✅ Found approved bundle: ${approvedBundleSid} (numberType: ${numberType})`);
            } else {
                console.warn(`[Port] ⚠️  No approved bundle found for ${targetCountryCode} ${numberType}`);

                // Try without numberType filter as fallback
                console.log(`[Port] Trying broader bundle search without numberType filter...`);
                const broaderBundles = await targetClient.numbers.v2.regulatoryCompliance.bundles.list({
                    status: 'twilio-approved',
                    isoCountry: targetCountryCode,
                    limit: 10
                });

                if (broaderBundles.length > 0) {
                    // Log what we found for debugging
                    console.log(`[Port] Found ${broaderBundles.length} bundles without numberType filter:`);
                    broaderBundles.forEach((b: any) => {
                        console.log(`[Port]   - ${b.sid}: ${b.friendlyName || 'unnamed'} (numberType: ${b.numberType || 'unknown'})`);
                    });
                }
            }

            // Find validated address
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
            console.warn(`[Port] Warning during pre-fetch:`, prefetchErr);
        }

        let updatedNumber;
        let updateParams: any = {
            accountSid: targetAccountSid,
            ...(validatedAddressSid && { addressSid: validatedAddressSid }),
            ...(approvedBundleSid && { bundleSid: approvedBundleSid })  // <-- KEY FIX: Include bundleSid
        };
        let attempts = 0;
        const maxAttempts = 3;

        console.log(`[Port] Starting transfer with pre-fetched resources:`, JSON.stringify(updateParams));

        while (attempts < maxAttempts) {
            attempts++;
            try {
                console.log(`[Port] Attempt ${attempts}: Updating SID ${sidToPort} with params:`, JSON.stringify(updateParams));

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
                            `Use the Bundle Manager tool or Twilio Console to create the bundle.`
                        );
                    }
                    throw portError;
                }

                if (portError.code === 21631 || portError.message?.includes('AddressSid')) {
                    console.warn(`[Port] Missing Address (21631). Looking for existing addresses in TARGET account...`);

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
                            console.log(`[Port] ✅ Found existing validated address ${addressToUse.sid} (${addressToUse.customerName})`);
                            console.log(`[Port] Reusing address to prevent duplicates`);
                            updateParams.addressSid = addressToUse.sid;
                            continue;
                        } else {
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
                            continue;
                        }
                    } catch (addrErr: any) {
                        console.error(`[Port] Failed to handle address:`, addrErr);
                        throw new Error(
                            `Failed to find or create address in target account: ${addrErr.message}. ` +
                            `Please create an address manually in account ${targetAccountSid}.`
                        );
                    }
                }
                else if (portError.code === 21649 || portError.message?.includes('Bundle required')) {
                    console.error(
                        `[Port] Bundle Required (21649). Target account ${targetAccountSid} needs an approved regulatory bundle for ` +
                        `${targetCountryCode || 'this country'} ${numberType || 'mobile'} numbers.`
                    );

                    // Try to find a matching bundle with more detailed logging
                    try {
                        const targetClient = twilio(accountSid, authToken, { accountSid: targetAccountSid });

                        // First, list ALL approved bundles for debugging
                        const allBundles = await targetClient.numbers.v2.regulatoryCompliance.bundles.list({
                            status: 'twilio-approved',
                            limit: 20
                        });

                        console.log(`[Port] All approved bundles in target account (${allBundles.length} total):`);
                        allBundles.forEach((b: any) => {
                            console.log(`[Port]   - ${b.sid}: country=${b.isoCountry}, numberType=${b.numberType}, name="${b.friendlyName || 'unnamed'}"`);
                        });

                        // Try to find exact match
                        const exactMatchBundles = await targetClient.numbers.v2.regulatoryCompliance.bundles.list({
                            status: 'twilio-approved',
                            isoCountry: targetCountryCode,
                            numberType: numberType,
                            limit: 5
                        });

                        if (exactMatchBundles.length > 0) {
                            const bundleSid = exactMatchBundles[0].sid;
                            console.log(`[Port] Found exact match bundle ${bundleSid}, retrying with bundleSid...`);
                            updateParams.bundleSid = bundleSid;
                            continue;
                        } else {
                            console.warn(`[Port] No bundle found matching country=${targetCountryCode} AND numberType=${numberType}`);
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