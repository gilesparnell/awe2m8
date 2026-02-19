import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { isAuthenticated } from '@/lib/api-auth';
import { getNumberCustomer, saveNumberCustomer } from '@/lib/twilio-helpers';

export async function POST(request: Request) {
    if (!await isAuthenticated(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

        const getValidatedSubAccount = async (subAccountSid: string) => {
            try {
                return await mainClient.api.v2010.accounts(subAccountSid).fetch();
            } catch (err) {
                throw new Error(`Subaccount ${subAccountSid} does not exist or is not accessible`);
            }
        };

        const getApprovedBundle = async (subAccountSid: string, isoCountry: string) => {
            const subAccount = await getValidatedSubAccount(subAccountSid);
            const subClient = twilio(subAccountSid, subAccount.authToken);
            const approvedBundles = await subClient.numbers.v2.regulatoryCompliance.bundles.list({
                status: 'twilio-approved',
                isoCountry
            });

            if (approvedBundles.length === 0) {
                throw new Error(`No Twilio-approved regulatory bundle found for ${isoCountry} in subaccount ${subAccountSid}`);
            }

            return approvedBundles[0];
        };

        const getApprovedBundleCountries = async (subAccountSid: string) => {
            await getValidatedSubAccount(subAccountSid);
            const subClient = twilio(accountSid, authToken, { accountSid: subAccountSid });

            // Twilio list filters can vary in behavior by account context; fetch and filter locally.
            const allBundles = await subClient.numbers.v2.regulatoryCompliance.bundles.list({ limit: 200 });
            const approvedBundles = allBundles.filter((bundle: any) => {
                const serialized = typeof bundle?.toJSON === 'function' ? bundle.toJSON() : bundle;
                const status = String(
                    serialized?.status ??
                    bundle?.status ??
                    ''
                ).toLowerCase();
                // Be permissive across Twilio status variants while still excluding non-approved statuses.
                return status.includes('approved') && !status.includes('rejected');
            });

            const extractIsoCountry = (bundle: any): string => {
                const serialized = typeof bundle?.toJSON === 'function' ? bundle.toJSON() : bundle;
                const directIso = (
                    serialized?.isoCountry ??
                    serialized?.iso_country ??
                    bundle?.isoCountry ??
                    bundle?.iso_country ??
                    ''
                ).toString().toUpperCase();
                if (directIso.length === 2) return directIso;

                const regulationType = (
                    serialized?.regulationType ??
                    serialized?.regulation_type ??
                    bundle?.regulationType ??
                    bundle?.regulation_type ??
                    ''
                ).toString().toUpperCase();
                // Fallback for shapes like "au_mobile_business"
                const prefix = regulationType.split(/[^A-Z]/).find(Boolean) || '';
                return prefix.length === 2 ? prefix : '';
            };

            return Array.from(
                new Set(
                    approvedBundles
                        .map((bundle: any) => extractIsoCountry(bundle))
                        .filter((iso: string) => iso.length === 2)
                )
            ).sort();
        };

        // LIST APPROVED BUNDLE COUNTRIES FOR A SUBACCOUNT
        if (action === 'list-approved-bundle-countries') {
            const subAccountSid = body.subAccountSid;
            if (!subAccountSid) {
                return NextResponse.json({ success: false, error: 'Missing subAccountSid' }, { status: 400 });
            }

            const countries = await getApprovedBundleCountries(subAccountSid);
            return NextResponse.json({
                success: true,
                countries
            });
        }

        // SEARCH AVAILABLE NUMBERS
        if (action === 'search-available-numbers') {
            const subAccountSid = body.subAccountSid;
            const isoCountry = (body.isoCountry || '').toUpperCase();
            const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 50);

            if (!subAccountSid) {
                return NextResponse.json({ success: false, error: 'Missing subAccountSid' }, { status: 400 });
            }
            if (!isoCountry) {
                return NextResponse.json({ success: false, error: 'Missing isoCountry' }, { status: 400 });
            }

            const bundle = await getApprovedBundle(subAccountSid, isoCountry);
            const available = await mainClient.availablePhoneNumbers(isoCountry).local.list({
                limit
            });

            return NextResponse.json({
                success: true,
                bundle: {
                    sid: bundle.sid,
                    friendlyName: bundle.friendlyName,
                    status: bundle.status
                },
                numbers: available.map((n: any) => ({
                    phoneNumber: n.phoneNumber,
                    friendlyName: n.friendlyName || n.phoneNumber,
                    locality: n.locality || '',
                    region: n.region || ''
                }))
            });
        }

        // CREATE NUMBER IN SUBACCOUNT
        if (action === 'create-number') {
            const subAccountSid = body.subAccountSid;
            const isoCountry = (body.isoCountry || '').toUpperCase();
            const requestedPhoneNumber = body.phoneNumber;

            if (!subAccountSid) {
                return NextResponse.json({ success: false, error: 'Missing subAccountSid' }, { status: 400 });
            }
            if (!isoCountry) {
                return NextResponse.json({ success: false, error: 'Missing isoCountry' }, { status: 400 });
            }
            if (!requestedPhoneNumber) {
                return NextResponse.json({ success: false, error: 'Missing phoneNumber' }, { status: 400 });
            }

            const subAccount = await getValidatedSubAccount(subAccountSid);
            const approvedBundle = await getApprovedBundle(subAccountSid, isoCountry);
            const subClient = twilio(subAccountSid, subAccount.authToken);

            const created = await subClient.incomingPhoneNumbers.create({
                phoneNumber: requestedPhoneNumber,
                bundleSid: approvedBundle.sid
            });

            return NextResponse.json({
                success: true,
                data: {
                    sid: created.sid,
                    phoneNumber: created.phoneNumber,
                    friendlyName: created.friendlyName,
                    accountSid: created.accountSid
                }
            });
        }

        // LIST NUMBERS
        if (action === 'list') {
            if (!sourceAccountSid) return NextResponse.json({ success: false, error: 'Missing sourceAccountSid' }, { status: 400 });

            const numbers = await mainClient.api.v2010.accounts(sourceAccountSid).incomingPhoneNumbers.list({ limit: 100 });

            return NextResponse.json({
                success: true,
                numbers: numbers.map(n => ({
                    sid: n.sid,
                    phoneNumber: n.phoneNumber,
                    friendlyName: n.friendlyName,
                    customer: getNumberCustomer(n.sid)
                }))
            });
        }

        // UPDATE NUMBER CUSTOMER LABEL
        if (action === 'update-customer') {
            if (!phoneNumberSid) {
                return NextResponse.json({ success: false, error: 'Missing phoneNumberSid' }, { status: 400 });
            }

            saveNumberCustomer(phoneNumberSid, typeof body.customer === 'string' ? body.customer : '');

            return NextResponse.json({
                success: true,
                data: {
                    sid: phoneNumberSid,
                    customer: getNumberCustomer(phoneNumberSid)
                }
            });
        }

        // LIST SUBACCOUNTS (Automatic Discovery)
        if (action === 'list-accounts') {
            const subAccounts = await mainClient.api.v2010.accounts.list({ status: 'active', limit: 100 });

            return NextResponse.json({
                success: true,
                subAccounts: subAccounts.map(a => ({
                    sid: a.sid,
                    friendlyName: a.friendlyName
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

                    // Use provided details or valid generic defaults (AU-centric fallback for now due to strict validation)
                    const biz = body.businessInfo || {};
                    const customAddr = body.address || {};

                    const newAddr = await targetClient.addresses.create({
                        customerName: biz.businessName || customAddr.customerName || 'Regulatory Compliance',
                        friendlyName: biz.friendlyName || customAddr.friendlyName || 'Regulatory Address',
                        street: biz.street || customAddr.street || '50a Habitat Way',
                        city: biz.city || customAddr.city || 'Lennox Head',
                        region: biz.state || biz.region || customAddr.region || 'NSW',
                        postalCode: biz.postalCode || customAddr.postalCode || '2478',
                        isoCountry: countryCode
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
