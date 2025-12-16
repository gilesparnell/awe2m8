import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: Request) {
    console.log("Twilio Cleanup API request received");
    try {
        const body = await request.json();
        let {
            action, // 'list-bundles', 'delete-bundles', 'list-addresses', 'cleanup-addresses', 'health-check'
            accountSid,
            authToken,
            subAccountSid,
            bundleSids, // Array of bundle SIDs to delete
            addressSids, // Array of address SIDs to delete
            keepOnePerCountry // For address cleanup
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

        if (!subAccountSid) {
            return NextResponse.json(
                { success: false, error: 'Missing subAccountSid' },
                { status: 400 }
            );
        }

        // Create client scoped to sub-account
        const client = twilio(accountSid, authToken, { accountSid: subAccountSid });

        // =====================================================================
        // ACTION: LIST BUNDLES
        // =====================================================================
        if (action === 'list-bundles') {
            console.log(`[Cleanup] Listing bundles for ${subAccountSid}`);

            const bundles = await client.numbers.v2.regulatoryCompliance
                .bundles
                .list({ limit: 100 });

            const bundleData = bundles.map((b: any) => ({
                sid: b.sid,
                friendlyName: b.friendlyName,
                status: b.status,
                regulationType: b.regulationType || '',
                isoCountry: b.isoCountry || '',
                numberType: b.numberType || '',
                dateCreated: b.dateCreated,
                dateUpdated: b.dateUpdated
            }));

            return NextResponse.json({
                success: true,
                bundles: bundleData,
                total: bundleData.length
            });
        }

        // =====================================================================
        // ACTION: DELETE BUNDLES
        // =====================================================================
        if (action === 'delete-bundles') {
            if (!bundleSids || !Array.isArray(bundleSids) || bundleSids.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'No bundle SIDs provided' },
                    { status: 400 }
                );
            }

            console.log(`[Cleanup] Deleting ${bundleSids.length} bundles from ${subAccountSid}`);

            const results = [];

            for (const bundleSid of bundleSids) {
                try {
                    // Fetch bundle first to check status
                    const bundle = await client.numbers.v2.regulatoryCompliance
                        .bundles(bundleSid)
                        .fetch();

                    // Safety check - don't delete approved bundles
                    if (bundle.status === 'twilio-approved') {
                        results.push({
                            sid: bundleSid,
                            success: false,
                            error: 'Cannot delete approved bundle',
                            skipped: true
                        });
                        continue;
                    }

                    // Delete it
                    await client.numbers.v2.regulatoryCompliance
                        .bundles(bundleSid)
                        .remove();

                    results.push({
                        sid: bundleSid,
                        success: true,
                        name: bundle.friendlyName,
                        status: bundle.status
                    });

                } catch (error: any) {
                    results.push({
                        sid: bundleSid,
                        success: false,
                        error: error.message
                    });
                }
            }

            const successCount = results.filter(r => r.success).length;

            return NextResponse.json({
                success: true,
                results,
                summary: {
                    total: bundleSids.length,
                    deleted: successCount,
                    failed: bundleSids.length - successCount
                }
            });
        }

        // =====================================================================
        // ACTION: LIST ADDRESSES
        // =====================================================================
        if (action === 'list-addresses') {
            console.log(`[Cleanup] Listing addresses for ${subAccountSid}`);

            const addresses = await client.addresses.list({ limit: 100 });

            const addressData = addresses.map(a => ({
                sid: a.sid,
                friendlyName: a.friendlyName,
                customerName: a.customerName,
                street: a.street,
                city: a.city,
                region: a.region,
                postalCode: a.postalCode,
                isoCountry: a.isoCountry,
                validated: a.validated,
                emergencyEnabled: a.emergencyEnabled,
                dateCreated: a.dateCreated
            }));

            // Group by country to identify duplicates
            const byCountry: { [key: string]: any[] } = {};
            addressData.forEach(addr => {
                const country = addr.isoCountry || 'UNKNOWN';
                if (!byCountry[country]) byCountry[country] = [];
                byCountry[country].push(addr);
            });

            // Mark duplicates
            const duplicates: string[] = [];
            Object.values(byCountry).forEach(countryAddresses => {
                if (countryAddresses.length > 1) {
                    // Keep first (oldest), mark rest as duplicates
                    countryAddresses.sort((a, b) =>
                        new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
                    );
                    countryAddresses.slice(1).forEach(addr => duplicates.push(addr.sid));
                }
            });

            return NextResponse.json({
                success: true,
                addresses: addressData,
                total: addressData.length,
                duplicates: duplicates,
                duplicateCount: duplicates.length,
                byCountry: Object.keys(byCountry).map(country => ({
                    country,
                    count: byCountry[country].length,
                    hasDuplicates: byCountry[country].length > 1
                }))
            });
        }

        // =====================================================================
        // HELPER: Audit Bundle Dependencies
        // =====================================================================
        async function getUsedAddressSids(client: any): Promise<Map<string, string[]>> {
            console.log("[Cleanup] Auditing Bundle Dependencies...");
            const usedMap = new Map<string, string[]>(); // AddressSid -> [BundleSids]

            try {
                // Fetch recent bundles (cover enough to be safe, e.g. 100)
                const bundles = await client.numbers.v2.regulatoryCompliance.bundles.list({ limit: 100 });

                // Fetch assignments in parallel (with concurrency limit ideally, but simple map for now)
                // We'll process in chunks of 5 to not hammer API
                const chunk = (arr: any[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
                const batches = chunk(bundles, 5);

                for (const batch of batches) {
                    await Promise.all(batch.map(async (b: any) => {
                        try {
                            const items = await client.numbers.v2.regulatoryCompliance.bundles(b.sid).itemAssignments.list();
                            for (const item of items) {
                                if (item.objectSid && item.objectSid.startsWith('AD')) { // AD is prefix for Address
                                    const existing = usedMap.get(item.objectSid) || [];
                                    existing.push(`${b.friendlyName} (${b.status})`);
                                    usedMap.set(item.objectSid, existing);
                                }
                            }
                        } catch (e) {
                            console.warn(`[Cleanup] Failed to check items for bundle ${b.sid}`, e);
                        }
                    }));
                }

                console.log(`[Cleanup] Audit Complete. Found ${usedMap.size} addresses in use.`);
            } catch (err) {
                console.error("[Cleanup] Failed to audit dependencies", err);
            }
            return usedMap;
        }

        // =====================================================================
        // ACTION: CLEANUP ADDRESSES (Keep one per country, delete rest)
        // =====================================================================
        if (action === 'cleanup-addresses') {
            console.log(`[Cleanup] Cleaning up addresses for ${subAccountSid}`);

            // 1. Audit Dependencies First
            const usedAddresses = await getUsedAddressSids(client);

            const addresses = await client.addresses.list({ limit: 100 });

            // Group by country
            const byCountry: { [key: string]: any[] } = {};
            addresses.forEach(addr => {
                const country = addr.isoCountry || 'UNKNOWN';
                if (!byCountry[country]) byCountry[country] = [];
                byCountry[country].push(addr);
            });

            const results: Array<{
                country: string;
                kept: { sid: string; customerName: string; validated: any };
                deleted: Array<{ sid: string; customerName: string; success: boolean; error?: string }>;
            }> = [];
            let totalDeleted = 0;

            for (const [country, countryAddresses] of Object.entries(byCountry)) {
                // Sort: Validated first, then by creation date (oldest first)
                countryAddresses.sort((a, b) => {
                    const aValidated = a.validated === true || a.validated === 'true';
                    const bValidated = b.validated === true || b.validated === 'true';

                    if (aValidated && !bValidated) return -1;
                    if (!aValidated && bValidated) return 1;

                    return new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime();
                });

                const keepAddress = countryAddresses[0];
                const deleteAddresses = countryAddresses.slice(1);

                results.push({
                    country,
                    kept: {
                        sid: keepAddress.sid,
                        customerName: keepAddress.customerName,
                        validated: keepAddress.validated
                    },
                    deleted: []
                });

                // Delete duplicates with safety check
                for (const addr of deleteAddresses) {
                    // CHECK DEPENDENCY
                    if (usedAddresses.has(addr.sid)) {
                        const usages = usedAddresses.get(addr.sid);
                        results[results.length - 1].deleted.push({
                            sid: addr.sid,
                            customerName: addr.customerName,
                            success: false,
                            error: `Protected: Used in ${usages?.[0] || 'active bundle'}`
                        });
                        continue;
                    }

                    try {
                        await client.addresses(addr.sid).remove();

                        results[results.length - 1].deleted.push({
                            sid: addr.sid,
                            customerName: addr.customerName,
                            success: true
                        });
                        totalDeleted++;
                    } catch (error: any) {
                        const msg = error.message.toLowerCase();
                        let finalError = error.message;

                        // Identify dependency error
                        if (msg.includes('in use') || msg.includes('bundle') || error.code === 21612) {
                            finalError = "This address is used by a Regulatory Bundle and cannot be deleted.";
                        }

                        results[results.length - 1].deleted.push({
                            sid: addr.sid,
                            customerName: addr.customerName,
                            success: false,
                            error: finalError
                        });
                    }
                }
            }

            return NextResponse.json({
                success: true,
                results,
                summary: {
                    totalAddresses: addresses.length,
                    deleted: totalDeleted,
                    remaining: addresses.length - totalDeleted
                }
            });
        }

        // =====================================================================
        // ACTION: DELETE SPECIFIC ADDRESSES
        // =====================================================================
        if (action === 'delete-addresses') {
            if (!addressSids || !Array.isArray(addressSids) || addressSids.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'No address SIDs provided' },
                    { status: 400 }
                );
            }

            console.log(`[Cleanup] Deleting ${addressSids.length} addresses from ${subAccountSid}`);

            // 1. Audit Dependencies First
            const usedAddresses = await getUsedAddressSids(client);

            const results = [];

            for (const addressSid of addressSids) {
                // CHECK DEPENDENCY
                if (usedAddresses.has(addressSid)) {
                    const usages = usedAddresses.get(addressSid);
                    results.push({
                        sid: addressSid,
                        customerName: '',
                        success: false,
                        error: `Protected: Used in ${usages?.[0] || 'active bundle'}`
                    });
                    continue;
                }

                try {
                    await client.addresses(addressSid).remove();
                    results.push({
                        sid: addressSid,
                        customerName: '',
                        success: true
                    });
                } catch (error: any) {
                    const msg = error.message.toLowerCase();
                    let finalError = error.message;

                    // Identify dependency error
                    if (msg.includes('in use') || msg.includes('bundle') || error.code === 21612) {
                        finalError = "This address is used by a Regulatory Bundle and cannot be deleted.";
                    }

                    results.push({
                        sid: addressSid,
                        customerName: '',
                        success: false,
                        error: finalError
                    });
                }
            }

            const successCount = results.filter(r => r.success).length;

            return NextResponse.json({
                success: true,
                results,
                summary: {
                    total: addressSids.length,
                    deleted: successCount,
                    failed: addressSids.length - successCount
                }
            });
        }

        // =====================================================================
        // ACTION: HEALTH CHECK
        // =====================================================================
        if (action === 'health-check') {
            console.log(`[Cleanup] Running health check for ${subAccountSid}`);

            // Check bundles
            const bundles = await client.numbers.v2.regulatoryCompliance
                .bundles
                .list({ limit: 100 });

            const approvedBundles = bundles.filter(b => b.status === 'twilio-approved');
            const pendingBundles = bundles.filter(b => b.status === 'pending-review' || b.status === 'in-review');
            const draftBundles = bundles.filter(b => b.status === 'draft');
            const rejectedBundles = bundles.filter(b => b.status === 'twilio-rejected');

            // Check addresses
            const addresses = await client.addresses.list({ limit: 100 });
            const validatedAddresses = addresses.filter((a: any) =>
                String(a.validated) === 'true' || a.validated === true
            );

            // 1. Audit Dependencies First (to check if addresses are used in bundles)
            const usedAddresses = await getUsedAddressSids(client);

            // Group addresses by country
            const byCountry: { [key: string]: any[] } = {};
            addresses.forEach((addr: any) => {
                const country = addr.isoCountry || 'UNKNOWN';
                if (!byCountry[country]) byCountry[country] = [];
                byCountry[country].push(addr);
            });

            const duplicateDetails: any[] = [];
            let hasDuplicateAddresses = false;

            Object.entries(byCountry).forEach(([country, countryAddresses]) => {
                if (countryAddresses.length > 1) {
                    hasDuplicateAddresses = true;

                    // Sort: Validated first, then by creation date (oldest first)
                    countryAddresses.sort((a, b) => {
                        const aValidated = String(a.validated) === 'true' || a.validated === true;
                        const bValidated = String(b.validated) === 'true' || b.validated === true;
                        if (aValidated && !bValidated) return -1;
                        if (!aValidated && bValidated) return 1;
                        return new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime();
                    });

                    // First one is kept, rest are potential duplicates
                    const potentialDuplicates = countryAddresses.slice(1);

                    potentialDuplicates.forEach(dup => {
                        const usage = usedAddresses.get(dup.sid);
                        const isUsed = !!usage;

                        duplicateDetails.push({
                            sid: dup.sid,
                            friendlyName: dup.friendlyName,
                            customerName: dup.customerName,
                            street: dup.street,
                            city: dup.city,
                            isoCountry: dup.isoCountry,
                            region: dup.region,
                            postalCode: dup.postalCode,
                            isUsedInBundle: isUsed,
                            bundleName: isUsed ? usage![0] : null,
                            canDelete: !isUsed
                        });
                    });
                }
            });

            // Health assessment
            const issues = [];
            const warnings = [];

            if (approvedBundles.length === 0) {
                issues.push('No approved regulatory bundles found');
            }

            if (validatedAddresses.length === 0) {
                issues.push('No validated addresses found');
            }

            if (draftBundles.length > 0) {
                warnings.push(`${draftBundles.length} draft bundle(s) should be completed or deleted`);
            }

            if (rejectedBundles.length > 0) {
                warnings.push(`${rejectedBundles.length} rejected bundle(s) should be reviewed and deleted`);
            }

            if (hasDuplicateAddresses) {
                warnings.push(`${duplicateDetails.filter(d => d.canDelete).length} duplicate addresses detected and safe to delete`);
                if (duplicateDetails.some(d => !d.canDelete)) {
                    issues.push(`${duplicateDetails.filter(d => !d.canDelete).length} duplicate addresses are locked by bundles`);
                }
            }


            // Generate summary for stats
            const addressesByCountry: { [key: string]: number } = {};
            Object.keys(byCountry).forEach(k => {
                addressesByCountry[k] = byCountry[k].length;
            });

            const isHealthy = issues.length === 0;

            return NextResponse.json({
                success: true,
                healthy: isHealthy,
                issues,
                warnings,
                bundles: {
                    total: bundles.length,
                    approved: approvedBundles.length,
                    pending: pendingBundles.length,
                    draft: draftBundles.length,
                    rejected: rejectedBundles.length
                },
                addresses: {
                    total: addresses.length,
                    validated: validatedAddresses.length,
                    byCountry: addressesByCountry,
                    hasDuplicates: hasDuplicateAddresses,
                    duplicates: duplicateDetails
                }
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error("Error in cleanup API:", error);
        return NextResponse.json(
            { success: false, error: error.message || 'An unknown error occurred' },
            { status: 500 }
        );
    }
}