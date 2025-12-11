
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
            // "get()" without params fetches the authenticated account (myself)
            // Actually, in Twilio Node lib, usually .accounts(sid).fetch() is how you get specific.
            // But to get "current", we can just look at the 'accountSid' variable we passed, 
            // OR try to fetch it to ensure valid creds.
            // A better check is to list accounts filtering by the Source Account SID to see if we own it.
            authenticatedAccount = await client.api.v2010.accounts(accountSid).fetch();
            console.log(`[Auth] Authenticated as: ${authenticatedAccount.friendlyName} (${authenticatedAccount.sid})`);

            if (sourceAccountSid && authenticatedAccount.sid === sourceAccountSid) {
                console.warn("[Auth] WARNING: You are authenticated as the SOURCE Subaccount. moving numbers between subaccounts requires MASTER credentials.");
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
                // Verify if we can access the account first (lightweight check) or just list numbers.
                const numbers = await client.api.v2010
                    .accounts(sourceAccountSid)
                    .incomingPhoneNumbers
                    .list({ limit: 100 }); // Limit to 100 for now to prevent massive payloads

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

        // Pre-fetch number details for intelligent filtering (e.g. Country Code)
        let targetCountryCode: string | undefined;
        try {
            const numberDetails = await client.api.v2010
                .accounts(sourceAccountSid)
                .incomingPhoneNumbers(sidToPort)
                .fetch();

            // Fix: 'countryCode' might not be in the strict type definition, but is often in the response.
            // We cast to any or use fallback parsing.
            const nd = numberDetails as any;
            if (nd.countryCode) {
                targetCountryCode = nd.countryCode;
            } else if (numberDetails.phoneNumber) {
                // Fallback: Infer from prefix
                if (numberDetails.phoneNumber.startsWith('+61')) targetCountryCode = 'AU';
                else if (numberDetails.phoneNumber.startsWith('+1')) targetCountryCode = 'US';
                else if (numberDetails.phoneNumber.startsWith('+44')) targetCountryCode = 'GB';
            }

            if (targetCountryCode) {
                console.log(`[Port] Target Number Country Code determined: ${targetCountryCode}`);
            }
        } catch (detailsErr) {
            console.warn(`[Port] Failed to fetch details for number ${sidToPort}, defaulting to broader search.`, detailsErr);
        }

        // Update the Phone Number resource
        let updatedNumber;
        let updateParams: any = { accountSid: targetAccountSid };
        let attempts = 0;
        const maxAttempts = 6; // Increased attempts to allow for full resolution flow

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
                        // If we have a bundle but still get "Address Required", it means we explicitly need an AddressSid too.
                        console.warn('[Port] Received Address error (21631) despite having BundleSid. Attempting to add AddressSid to pair with Bundle.');
                    }

                    if (!updateParams.addressSid) {
                        console.warn(`[Port] Missing Address (21631). Searching target account for ${targetCountryCode || 'any'} address...`);

                        const addressListParams: any = { limit: 1 };
                        if (targetCountryCode) {
                            addressListParams.isoCountry = targetCountryCode;
                        }

                        const addresses = await client.api.v2010
                            .accounts(targetAccountSid)
                            .addresses
                            .list(addressListParams);

                        if (addresses.length > 0) {
                            const validAddressSid = addresses[0].sid;
                            console.log(`[Port] Found address ${validAddressSid} (Country: ${addresses[0].isoCountry}). Adding to retry params.`);
                            updateParams.addressSid = validAddressSid;
                            continue; // Retry loop
                        } else {
                            throw new Error(`Port Failed (Address Required): No addresses found on target account ${targetAccountSid} matching country ${targetCountryCode || 'any'}. Please create a validation address first.`);
                        }
                    }
                }
                // CASE 2: Bundle Requirement (Error 21649)
                else if ((portError.code === 21649 || portError.message?.includes('Bundle required'))) {
                    // Start Case 2 logic
                    if (!updateParams.bundleSid) {
                        console.warn(`[Port] Missing Regulatory Bundle (21649). Searching target account for approved ${targetCountryCode || ''} bundles...`);

                        // Instantiate client scoped to target subaccount to find its bundles
                        const subAccountClient = twilio(accountSid, authToken, { accountSid: targetAccountSid });

                        const bundleListParams: any = {
                            status: 'twilio-approved',
                            limit: 5 // Check top 5 bundles
                        };
                        if (targetCountryCode) {
                            bundleListParams.isoCountry = targetCountryCode;
                        }

                        // Fetch "twilio-approved" bundles
                        const bundles = await subAccountClient.numbers.v2.regulatoryCompliance.bundles.list(bundleListParams);

                        if (bundles.length > 0) {
                            let selectedBundleSid: string | undefined;
                            let selectedAddressSid: string | undefined;

                            console.log(`[Port] Found ${bundles.length} candidate bundles. Scanning for one with valid Address assignment...`);

                            // Iterate to find a bundle with an Address (AD) item
                            for (const bundle of bundles) {
                                try {
                                    const itemAssignments = await subAccountClient.numbers.v2.regulatoryCompliance
                                        .bundles(bundle.sid)
                                        .itemAssignments
                                        .list({ limit: 20 });

                                    const addressAssignment = itemAssignments.find((item: any) => item.objectSid && item.objectSid.startsWith('AD'));

                                    if (addressAssignment) {
                                        console.log(`[Port] MATCH: Bundle ${bundle.sid} (${bundle.friendlyName}) contains Address ${addressAssignment.objectSid}.`);
                                        selectedBundleSid = bundle.sid;
                                        selectedAddressSid = addressAssignment.objectSid;
                                        break; // Found a perfect match
                                    } else {
                                        console.log(`[Port] Bundle ${bundle.sid} has no direct Address assignment.`);
                                    }
                                } catch (scanErr) {
                                    console.warn(`[Port] Failed to scan bundle ${bundle.sid}:`, scanErr);
                                }
                            }

                            // If no bundle with address found, fallback to the first one
                            if (!selectedBundleSid) {
                                console.warn("[Port] No bundle found with direct Address assignment. Falling back to first available bundle.");
                                selectedBundleSid = bundles[0].sid;
                            }

                            console.log(`[Port] Selected Bundle: ${selectedBundleSid}`);

                            // Apply selections
                            updateParams.bundleSid = selectedBundleSid;

                            if (selectedAddressSid) {
                                console.log(`[Port] Using Bundle-linked AddressSid: ${selectedAddressSid}`);
                                updateParams.addressSid = selectedAddressSid;
                            } else {
                                // Fallback: If we didn't find an address inside the bundle, but we have a generic one...
                                if (updateParams.addressSid) {
                                    console.log('[Port] Retaining generic AddressSid as last resort (Warning: Mismatch Risk).');
                                }
                            }

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
