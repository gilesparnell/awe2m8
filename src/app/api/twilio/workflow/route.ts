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

        // =====================================================================
        // ACTION: CREATE BUNDLE
        // =====================================================================
        if (action === 'create-bundle') {
            console.log(`[Create Bundle] Request for SubAccount: ${body.subAccountSid}`);

            const subSid = body.subAccountSid;
            const businessInfo = body.businessInfo || {};

            if (!subSid) throw new Error("Missing subAccountSid");

            // 1. Authenticate AS SubAccount
            // We need the SubAccount's AuthToken
            console.log(`[Create Bundle] Fetching AuthToken for ${subSid}...`);
            const subAccount = await client.api.v2010.accounts(subSid).fetch();
            const subClient = twilio(subSid, subAccount.authToken);
            const subAuth = Buffer.from(`${subSid}:${subAccount.authToken}`).toString('base64');

            const fs = require('fs');
            const path = require('path');
            const https = require('https');

            // 2. Address Managment - Reuse if exists
            console.log(`[Create Bundle] Checking for existing validated address in ${businessInfo.country || 'AU'}...`);
            let addressSid;

            try {
                const existingAddrs = await subClient.addresses.list({
                    isoCountry: businessInfo.country || 'AU',
                    customerName: businessInfo.businessName || 'AWE2M8 Pty Ltd',
                    limit: 5
                });

                // Find one that matches critical fields
                const match = existingAddrs.find((a: any) =>
                    a.street === (businessInfo.street || '50a Habitat Way') &&
                    a.region === (businessInfo.state || 'NSW') &&
                    a.city === (businessInfo.city || 'Lennox Head')
                );

                if (match) {
                    console.log(`[Create Bundle] ✅ Found existing matching address: ${match.sid}`);
                    addressSid = match.sid;
                }
            } catch (addrCheckErr) {
                console.warn(`[Create Bundle] Failed to check existing addresses, proceeding to create new one.`, addrCheckErr);
            }

            if (!addressSid) {
                console.log(`[Create Bundle] Creating NEW Address...`);
                const address = await subClient.addresses.create({
                    customerName: businessInfo.businessName || 'AWE2M8 Pty Ltd',
                    street: businessInfo.street || '50a Habitat Way',
                    city: businessInfo.city || 'Lennox Head',
                    region: businessInfo.state || 'NSW',
                    postalCode: businessInfo.postalCode || '2478',
                    isoCountry: businessInfo.country || 'AU',
                    emergencyEnabled: false,
                    friendlyName: 'Regulatory Address (Created via API)'
                });
                console.log(`[Create Bundle] New Address Created: ${address.sid}`);
                addressSid = address.sid;
            } else {
                console.log(`[Create Bundle] Using Existing Address: ${addressSid}`);
            }

            // 3. Upload Documents (Helper)
            const uploadDocument = (docType: string, filename: string, attributes: any) => new Promise<string>((resolve, reject) => {
                console.log(`[Create Bundle] Uploading ${filename} as ${docType}...`);
                const filePath = path.join(process.cwd(), 'public', 'admin', 'documents', filename);

                if (!fs.existsSync(filePath)) {
                    reject(new Error(`File not found on server: ${filePath}`));
                    return;
                }

                const boundary = 'TwilioBoundary' + Math.random().toString(16);
                const content = fs.readFileSync(filePath);

                const parts = [
                    `--${boundary}`, `Content-Disposition: form-data; name="FriendlyName"`, '', `${filename} (API Upload)`,
                    `--${boundary}`, `Content-Disposition: form-data; name="Type"`, '', docType,
                    `--${boundary}`, `Content-Disposition: form-data; name="Attributes"`, '', JSON.stringify(attributes),
                    `--${boundary}`, `Content-Disposition: form-data; name="File"; filename="${filename}"`, `Content-Type: application/pdf`, '', ''
                ];

                const payload = Buffer.concat([
                    Buffer.from(parts.join('\r\n')),
                    content,
                    Buffer.from(`\r\n--${boundary}--`)
                ]);

                const req = https.request({
                    hostname: 'numbers.twilio.com',
                    path: '/v2/RegulatoryCompliance/SupportingDocuments',
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${subAuth}`,
                        'Content-Type': `multipart/form-data; boundary=${boundary}`,
                        'Content-Length': payload.length
                    }
                }, (res: any) => {
                    let data = '';
                    res.on('data', (c: any) => data += c);
                    res.on('end', () => {
                        if (res.statusCode < 300) {
                            const json = JSON.parse(data);
                            resolve(json.sid);
                        } else {
                            reject(new Error(`Twilio Upload Error: ${data}`));
                        }
                    });
                });

                req.on('error', (e: any) => reject(e));
                req.write(payload);
                req.end();
            });

            // 4. Upload Specific Documents
            // Map AU specific attributes
            const regAttrs = {
                business_name: businessInfo.businessName,
                document_number: businessInfo.ein // Maps 'ein' form field to 'document_number' (ABN)
            };
            const addrAttrs = {
                address_sids: [addressSid]
            };

            const regDocSid = await uploadDocument('commercial_registrar_excerpt', 'AWE2M8 Company Registration.pdf', regAttrs);
            const addrDocSid = await uploadDocument('utility_bill', 'AWE2M8 Business Address.pdf', addrAttrs);

            console.log(`[Create Bundle] Docs Uploaded: ${regDocSid}, ${addrDocSid}`);

            // 5. Create End User
            // AU Business Attributes
            const endUserAttrs = {
                business_name: businessInfo.businessName,
                business_type: businessInfo.businessType || 'corporation', // corporation/partnership etc
                business_registration_identifier: businessInfo.ein,
                business_identity: 'direct_customer', // usually direct
                business_industry: businessInfo.businessIndustry || 'TECHNOLOGY',
            };

            console.log(`[Create Bundle] Creating EndUser...`);
            const endUser = await subClient.numbers.v2.regulatoryCompliance.endUsers.create({
                friendlyName: businessInfo.businessName,
                type: 'business',
                attributes: JSON.stringify(endUserAttrs)
            });
            console.log(`[Create Bundle] EndUser Created: ${endUser.sid}`);

            // 6. Create Bundle
            console.log(`[Create Bundle] Creating Bundle container...`);
            const bundle = await subClient.numbers.v2.regulatoryCompliance.bundles.create({
                friendlyName: `${businessInfo.businessName} - Porting Bundle`,
                email: businessInfo.email,
                // status: 'draft', // Type error, defaults to draft
                endUserType: 'business',
                isoCountry: 'AU',
                numberType: 'mobile'
            });

            // 7. Assign Items
            await subClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: endUser.sid });
            await subClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: regDocSid });
            await subClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: addrDocSid });

            // 8. Submit
            console.log(`[Create Bundle] Submitting Bundle ${bundle.sid}...`);
            const submitted = await subClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).update({
                status: 'pending-review'
            });

            return NextResponse.json({
                success: true,
                bundleSid: bundle.sid,
                status: submitted.status,
                addressSid: addressSid,
                friendlyName: submitted.friendlyName
            });
        }

        // =====================================================================
        // ACTION: CHECK STATUS
        // =====================================================================
        // ... (This logic actually lives in a different route file /api/twilio/check-status, 
        //      but we can keep generic logic here if we merge)
        // For now, let's just implement the 'submit-bundle' block requested by Frontend

        // =====================================================================
        // ACTION: SUBMIT BUNDLE (Draft -> Pending)
        // =====================================================================
        if (action === 'submit-bundle') {
            let { bundleSid, subAccountSid } = body;

            // Fallback: If subAccountSid is not provided (e.g. Server Auth mode on frontend),
            // assume we want to submit for the currently authenticated account (Master).
            if (!subAccountSid) {
                console.log("[Submit Bundle] No subAccountSid provided. Defaulting to authenticated Account SID.");
                subAccountSid = accountSid;
            }

            if (!bundleSid || !subAccountSid) {
                return NextResponse.json({ success: false, error: 'Missing bundleSid or subAccountSid' }, { status: 400 });
            }

            console.log(`[Submit Bundle] Submitting ${bundleSid} for account ${subAccountSid}...`);

            // Re-auth as target account to ensure we have correct permissions/context works
            // If subAccountSid === accountSid, this effectively re-fetches self, which is fine but slightly redundant.
            // Converting to straight update if SIDs match to save an API call.

            let targetClient = client;
            if (subAccountSid !== accountSid) {
                try {
                    const subAccount = await client.api.v2010.accounts(subAccountSid).fetch();
                    targetClient = twilio(subAccountSid, subAccount.authToken);
                } catch (err: any) {
                    console.error(`[Submit Bundle] Failed to fetch subaccount credentials: ${err.message}`);
                    return NextResponse.json({ success: false, error: `Invalid subAccountSid: ${err.message}` }, { status: 400 });
                }
            }

            try {
                const updated = await targetClient.numbers.v2.regulatoryCompliance.bundles(bundleSid).update({
                    status: 'pending-review'
                });

                console.log(`[Submit Bundle] Success! New Status: ${updated.status}`);
                return NextResponse.json({ success: true, status: updated.status });
            } catch (e: any) {
                console.error(`[Submit Bundle] Failed: ${e.message}`);
                return NextResponse.json({ success: false, error: e.message }, { status: 500 });
            }
        }

        // =====================================================================
        // ACTION: DELETE BUNDLE (Drafts Only ideally)
        // =====================================================================
        if (action === 'delete-bundle') {
            const { bundleSid, subAccountSid } = body;
            if (!bundleSid) {
                return NextResponse.json({ success: false, error: 'Missing bundleSid' }, { status: 400 });
            }

            let targetClient = client;
            // If subAccountSid provided and different from master, switch context
            if (subAccountSid && subAccountSid !== accountSid) {
                try {
                    const subAccount = await client.api.v2010.accounts(subAccountSid).fetch();
                    targetClient = twilio(subAccountSid, subAccount.authToken);
                } catch (err: any) {
                    return NextResponse.json({ success: false, error: `Invalid subAccountSid: ${err.message}` }, { status: 400 });
                }
            }

            try {
                // Determine status first? Or just try delete. Twilio only allows deleting DRAFT bundles usually.
                // We'll trust the API to throw if not allowed.
                await targetClient.numbers.v2.regulatoryCompliance.bundles(bundleSid).remove();
                console.log(`[Delete Bundle] Deleted bundle ${bundleSid}`);
                return NextResponse.json({ success: true });
            } catch (e: any) {
                console.error(`[Delete Bundle] Failed: ${e.message}`);
                return NextResponse.json({ success: false, error: e.message }, { status: 500 });
            }
        }

        // ACTION: LIST NUMBERS

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

            // Determine number type
            // Explicitly check for mobile pattern for AU
            if (numberDetails.phoneNumber && numberDetails.phoneNumber.startsWith('+614')) {
                numberType = 'mobile';
            } else {
                // Fallback to capabilities
                const capabilities = numberDetails.capabilities;
                if (capabilities?.mms || capabilities?.sms) {
                    numberType = 'mobile';
                } else {
                    numberType = 'local';
                }
            }

            if (targetCountryCode) {
                console.log(`[Port] Target Number Country: ${targetCountryCode}, Type: ${numberType}`);
            }
        } catch (detailsErr) {
            console.warn(`[Port] Failed to fetch details for number ${sidToPort}, defaulting to broader search.`, detailsErr);
            // Fallback inference if API fails
            if (phoneNumber && phoneNumber.startsWith('+614')) {
                targetCountryCode = 'AU';
                numberType = 'mobile';
            }
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

                // Friendly 404: Number likely already moved
                if (portError.code === 20404 || portError.status === 404) {
                    throw new Error(
                        `The phone number could not be found in the Source Account. It may have already been moved to the Target Account. Refresh the page to check.`
                    );
                }

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

                // CASE 1: Bundle Requirement (or AU Address Requirement which needs Bundle)
                // Error 21649 = Bundle Required
                // Error 21631 = Address Required (But for AU, we need Bundle)
                const isBundleError = portError.code === 21649 || portError.message?.includes('Bundle required');
                const isAddressError = portError.code === 21631 || portError.message?.includes('AddressSid');
                const needsBundle = isBundleError || (isAddressError && targetCountryCode === 'AU');

                if (needsBundle) {
                    // LOOP PREVENTION: If we already provided a bundleSid and it Failed again with 21649, 
                    // that means the bundle we provided was REJECTED. Don't loop infinitely.
                    if (updateParams.bundleSid && portError.code === 21649) {
                        throw new Error(
                            `The target account has a bundle (${updateParams.bundleSid}), but it was rejected for this number type. ` +
                            `Ensure you have an approved bundle specifically for ${numberType || 'this number type'}.`
                        );
                    }

                    // Reset params to avoid polluting state with previous attempts
                    updateParams = { accountSid: targetAccountSid };

                    console.error(`[Port] Compliance Constraint (AU/Bundle). Fetching credentials for ${targetAccountSid}...`);

                    try {
                        // FIX: Iterate using DIRECT SUBACCOUNT AUTH (Mirrors Debug Script)
                        // Using Master+accountSid override sometimes hides Regulatory resources
                        const subAccount = await client.api.v2010.accounts(targetAccountSid).fetch();
                        const targetClient = twilio(targetAccountSid, subAccount.authToken);


                        // STRATEGY: Iterate ALL Approved Bundles, and for each, Iterate ALL Addresses
                        // This solves:
                        // 1. "Bundle Rejected" (21649) -> Bundle doesn't match number capabilities -> Try next bundle
                        // 2. "Address Not In Bundle" (21651) -> Address mismatch -> Try next address

                        // 1. Fetch All Candidates
                        let allBundles = [];

                        // Strict First
                        const strictBundles = await targetClient.numbers.v2.regulatoryCompliance.bundles.list({
                            status: 'twilio-approved',
                            isoCountry: targetCountryCode || 'AU',
                            numberType: numberType
                        });
                        allBundles.push(...strictBundles);

                        // Loose/Legacy (undefined type) Second
                        const looseBundles = await targetClient.numbers.v2.regulatoryCompliance.bundles.list({
                            status: 'twilio-approved',
                            isoCountry: targetCountryCode || 'AU'
                        });
                        // Filter out duplicates (if strict found same as loose)
                        const seenSids = new Set(allBundles.map(b => b.sid));
                        looseBundles.forEach(b => {
                            if (!seenSids.has(b.sid)) allBundles.push(b);
                        });

                        if (allBundles.length === 0) {
                            throw new Error(`Target account ${targetAccountSid} has NO approved bundles for ${targetCountryCode}.`);
                        }

                        // 2. Fetch All Addresses
                        const addrs = await targetClient.addresses.list({ isoCountry: targetCountryCode || 'AU' });
                        if (addrs.length === 0) {
                            console.warn("[Port] No addresses found. Creating temporary address...");
                            const newAddr = await targetClient.addresses.create({
                                customerName: 'AWE2M8 Porting',
                                street: '50a Habitat Way',
                                city: 'Lennox Head',
                                region: 'NSW',
                                postalCode: '2478',
                                isoCountry: 'AU'
                            });
                            addrs.push(newAddr);
                        }

                        // 3. Nested Execution Loop
                        let success = false;

                        // Outer Loop: Bundles
                        bundleLoop:
                        for (const bundle of allBundles) {
                            console.log(`[Port] Attempting with Bundle ${bundle.sid} (${(bundle as any).numberType || 'generic'})...`);
                            updateParams.bundleSid = bundle.sid;

                            // Inner Loop: Addresses
                            for (const addr of addrs) {
                                updateParams.addressSid = addr.sid;

                                try {
                                    updatedNumber = await client.api.v2010
                                        .accounts(sourceAccountSid)
                                        .incomingPhoneNumbers(sidToPort)
                                        .update(updateParams);

                                    console.log(`[Port] ✅ MATCH! Port succeeded with Bundle ${bundle.sid} + Address ${addr.sid}`);
                                    success = true;
                                    break bundleLoop; // Break EVERYTHING, we are done!

                                } catch (innerErr: any) {
                                    // Diagnose and Continue
                                    if (innerErr.code === 21651) {
                                        // Address mismatch - Try next address
                                        // console.log(`[Port] Address ${addr.sid} not in bundle. Continuing...`);
                                        continue;
                                    }
                                    if (innerErr.code === 21649 || innerErr.message?.includes('Bundle required')) {
                                        // Bundle rejected (even though we sent it). This means this bundle isn't valid for this number.
                                        console.warn(`[Port] Bundle ${bundle.sid} rejected by Twilio (21649). Trying next bundle...`);
                                        break; // Break inner loop, try next Bundle
                                    }

                                    // Any other error? We can't handle it here.
                                    console.error(`[Port] Unexpected error with Bundle ${bundle.sid}: ${innerErr.message}`);
                                    throw innerErr;
                                }
                            }
                        }

                        if (success) {
                            // Break the outer retry loop 'while (attempts < max)'
                            break;
                        } else {
                            console.warn("[Port] Exhausted all Bundle+Address combinations without success.");
                            throw new Error(
                                `Target account ${targetAccountSid} requires an APPROVED Regulatory Bundle for ${targetCountryCode} (${numberType}). ` +
                                `Tried ${allBundles.length} bundles and ${addrs.length} addresses, but none worked.`
                            );
                        }
                    } catch (checkErr: any) {
                        console.error(`[Port] Bundle/Address iteration failed:`, checkErr.message);
                        throw checkErr;
                    }
                }

                // CASE 2: Generic Address Requirement (Legacy/Non-strict regions)
                if (isAddressError) {
                    console.warn(`[Port] Missing Address (21631). Checking for existing address in TARGET account...`);
                    try {
                        const targetClient = twilio(accountSid, authToken, { accountSid: targetAccountSid });
                        const targetCountry = targetCountryCode || 'AU';

                        // Check for existing addresses first
                        const existingAddrs = await targetClient.addresses.list({ isoCountry: targetCountry, limit: 1 });

                        if (existingAddrs.length > 0) {
                            console.log(`[Port] Found existing address ${existingAddrs[0].sid}. Retrying...`);
                            updateParams.addressSid = existingAddrs[0].sid;
                            continue;
                        }

                        console.log(`[Port] No address found. Creating generic address...`);
                        const newAddress = await targetClient.addresses.create({
                            customerName: 'Transfer Address',
                            friendlyName: 'AWE2M8 Transfer Address', // Explicit name
                            street: '123 Transfer Street',
                            city: 'Sydney',
                            region: targetCountry === 'AU' ? 'NSW' : 'CA',
                            postalCode: targetCountry === 'AU' ? '2000' : '94102',
                            isoCountry: targetCountry,
                            emergencyEnabled: false
                        });

                        console.log(`[Port] Created Address ${newAddress.sid}. Retrying...`);
                        updateParams.addressSid = newAddress.sid;
                        continue;
                    } catch (addrErr: any) {
                        console.error(`[Port] Failed to create address:`, addrErr);
                        throw new Error(`Failed to create fallback address: ${addrErr.message}`);
                    }
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