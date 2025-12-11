
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

// Helper to get Twilio Client
const getTwilioClient = (sid: string, token: string) => {
    return twilio(sid, token);
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        // 1. Get Credentials (Header OR Env Var)
        let accountSid = req.headers.get("x-twilio-account-sid");
        let authToken = req.headers.get("x-twilio-auth-token");

        if (!accountSid || !authToken) {
            // Fallback to Server Env Vars
            accountSid = process.env.TWILIO_ACCOUNT_SID || null;
            authToken = process.env.TWILIO_AUTH_TOKEN || null;
        }

        if (!accountSid || !authToken) {
            return NextResponse.json({ error: "Missing Credentials. Use x-twilio-account-sid/auth-token headers OR set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN env vars." }, { status: 401 });
        }

        // Initialize main client (for subaccount creation if needed)
        const client = getTwilioClient(accountSid, authToken);

        // 2. Extract Data
        const businessName = formData.get("businessName") as string;
        const createSubAccount = formData.get("createSubAccount") === "true";
        const subAccountName = formData.get("subAccountName") as string;

        // 3. Sub-Account Handling
        let targetAccountSid = accountSid;

        // Explicitly provided Sub-Account SID (from "One-Click" flow)
        const targetSubSid = formData.get("targetSubAccountSid") as string;

        if (targetSubSid && targetSubSid.startsWith('AC')) {
            targetAccountSid = targetSubSid;
            // We confirm we are operating on this subaccount
        }
        // Otherwise, create new if requested
        else if (createSubAccount && subAccountName) {
            try {
                const sub = await client.api.accounts.create({ friendlyName: subAccountName });
                targetAccountSid = sub.sid;
            } catch (e: any) {
                throw new Error(`Failed to create subaccount: ${e.message}`);
            }
        }

        // Context-aware client (targets either parent or new subaccount)
        const targetClient = twilio(accountSid, authToken, { accountSid: targetAccountSid });

        // 4. Upload Documents
        // We handle 'businessDoc', 'addressDoc', 'repDoc'
        const docIds: Record<string, string> = {};

        // NOTE: We need to create the Address FIRST so we can reference it in the address document
        console.log('Creating Address Resource...');
        let address;
        try {
            address = await client.addresses.create({
                customerName: businessName,
                street: formData.get("street") as string,
                city: formData.get("city") as string,
                region: formData.get("state") as string,
                postalCode: formData.get("postalCode") as string,
                isoCountry: formData.get("country") as string,
                friendlyName: `${businessName} - HQ`
            });
            console.log(`Address created successfully: ${address.sid}`);
        } catch (addressError: any) {
            console.error('Address creation failed:', {
                message: addressError.message,
                code: addressError.code,
                moreInfo: addressError.moreInfo,
                details: addressError.details
            });
            throw new Error(`Failed to create address: ${addressError.message}`);
        }

        const docFields = [
            { key: 'businessDoc', type: 'commercial_registrar_excerpt', friendlySuffix: 'Business Registration' },
            { key: 'addressDoc', type: 'utility_bill', friendlySuffix: 'Proof of Address' },
            { key: 'repDoc', type: 'government_issued_document', friendlySuffix: 'Representative ID' }
        ];

        for (const field of docFields) {
            const file = formData.get(field.key) as File | null;
            if (file && file.size > 0) {
                // We need to upload this using raw fetch because of the file handling
                const uploadFormData = new FormData();
                const buffer = Buffer.from(await file.arrayBuffer());
                // Blob needed for FormData
                const blob = new Blob([buffer], { type: file.type });
                uploadFormData.append('FriendlyName', `${businessName} - ${field.friendlySuffix}`);
                uploadFormData.append('Type', field.type);

                // Add required attributes based on document type
                if (field.key === 'businessDoc') {
                    // Business registration document needs business_name AND document_number (ABN)
                    uploadFormData.append('Attributes', JSON.stringify({
                        business_name: businessName,
                        document_number: formData.get("ein") || ''
                    }));
                } else if (field.key === 'addressDoc') {
                    // Address proof document needs address_sids
                    uploadFormData.append('Attributes', JSON.stringify({
                        address_sids: [address.sid]
                    }));
                }

                uploadFormData.append('File', blob, file.name || 'document.pdf');

                // CRITICAL: Specify which account should own this document
                uploadFormData.append('AccountSid', targetAccountSid);

                console.log(`Uploading ${field.friendlySuffix} for account ${targetAccountSid}...`);

                const docRes = await fetch('https://numbers.twilio.com/v2/RegulatoryCompliance/SupportingDocuments', {
                    method: 'POST',
                    headers: {
                        // Use PARENT credentials for authentication, even when creating resources for subaccount
                        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
                    },
                    body: uploadFormData
                });

                if (!docRes.ok) {
                    const errText = await docRes.text();
                    throw new Error(`Failed to upload ${field.friendlySuffix}: ${errText}`);
                }

                const docData = await docRes.json();
                docIds[field.key] = docData.sid;
            }
        }

        if (!docIds['businessDoc']) {
            throw new Error("Business Document upload failed or missing.");
        }

        // 5. Create End User (Business Profile)
        // Twilio v2.0 Requirement: Address is separate from Business Profile.
        // We must FIRST create a 'business_address' End User (or reuse one?) — actually, standard practice:
        // Create an End User of type 'business_address'? No, addresses are usually managed via /Addresses or within the bundle?
        // Wait, the error says: "Attribute(s) (website, city, street...) not mapped to object (business)".
        // This implies creating an EndUser of type 'business' does NOT accept address fields directly in Attributes?
        // Let's check docs.
        // For 'business_profile_bundle' (A2P), we need a 'business_information' assignment.
        // The attributes for 'business' type usually include address_sids?
        // Actually, simply: Remove the address fields from the 'business' EndUser attributes?
        // But then where does the address go?
        // Ah, Twilio uses a separate End User for the address ONLY if using 'address' type?
        // Or we need to use 'address_sids' linking to an Address resource?
        // HOWEVER, for A2P 10DLC, we usually create a Customer Profile.
        // Let's try to strip the offending fields if they are indeed not allowed on 'business' object directly in this API version.
        // But we need the address.
        // The error suggests we might be mixing schema versions.
        // Let's try creating a "headquarters" address object first? No.
        // Let's look at the mapping.
        // 'business_name', 'business_type', 'business_registration_number' -> YES.
        // 'website', 'social_media_profile_urls' -> YES.
        // 'email', 'phone_number_mobile' -> YES.
        // ADDRESS fields -> NO?
        // Maybe we need to pass `address_sids`?
        // OR create an End User of type `authorized_representative_1`?
        // LET'S TRY: Create the EndUser without the address fields that caused the error, 
        // AND create a standard Twilio Address resource, then link it? 
        // OR, create a separate EndUser for the address?
        // The simplest fix for "Attribute not mapped" is to REMOVE them.
        // BUT we need the address for approval.
        // Wait, the API might expect 'business_address' as a separate object?
        // Let's try creating the Address as a supporting document? No.
        // Let's try creating a Twilio Address Resource first.


        console.log('Creating End User...');
        let endUser;
        const country = formData.get("country") as string || 'AU';

        try {
            if (country === 'AU') {
                // Australia uses Regulatory Compliance EndUser
                // NOTE: The Regulatory Compliance API only accepts specific attributes for 'business' type
                console.log('Creating EndUser via Regulatory Compliance API...');
                const endUserAttributes = {
                    business_name: businessName,
                    business_type: formData.get("businessType") || 'corporation',
                    business_registration_number: formData.get("ein") || '',
                    business_website: formData.get("website") || 'https://awe2m8.ai',
                    business_industry: formData.get("businessIndustry") || 'Technology'
                    // NOTE: authorized_representative_* fields are NOT supported in EndUser attributes
                    // These will be handled via separate supporting documents or bundle-level fields
                };

                console.log('EndUser attributes:', endUserAttributes);

                endUser = await targetClient.numbers.v2.regulatoryCompliance.endUsers.create({
                    friendlyName: businessName,
                    type: 'business',
                    attributes: endUserAttributes
                });
                console.log(`End User created successfully: ${endUser.sid}`);
            } else {
                // Other countries use TrustHub EndUser
                console.log('Creating EndUser via TrustHub API...');
                const endUserAttributes = {
                    business_name: businessName,
                    business_type: formData.get("businessType") || 'llc',
                    business_registration_number: formData.get("ein") || ''
                };

                console.log('EndUser attributes:', endUserAttributes);

                endUser = await targetClient.trusthub.v1.endUsers.create({
                    friendlyName: businessName,
                    type: 'business',
                    attributes: endUserAttributes
                });
                console.log(`End User created successfully: ${endUser.sid}`);
            }
        } catch (endUserError: any) {
            console.error('End User creation failed:', {
                message: endUserError.message,
                code: endUserError.code,
                moreInfo: endUserError.moreInfo,
                details: endUserError.details,
                status: endUserError.status
            });
            throw new Error(`Failed to create End User: ${endUserError.message}`);
        }

        console.log('Creating Regulatory Bundle...');
        // 6. Create Bundle - Different API based on country
        let bundle;

        try {
            if (country === 'AU') {
                // Australia uses Regulatory Compliance API with specific regulation type
                console.log('Using Regulatory Compliance API for Australia...');
                bundle = await targetClient.numbers.v2.regulatoryCompliance.bundles.create({
                    friendlyName: `${businessName} - Regulatory Bundle`,
                    email: formData.get("email") as string,
                    // regulationType is set via the regulation parameter
                    isoCountry: 'AU',
                    endUserType: 'business',
                    numberType: 'mobile',
                    regulation: 'primary_customer_profile_bundle_australia'
                } as any); // Type assertion needed for regulation parameter
                console.log(`Bundle created successfully: ${bundle.sid}`);
            } else {
                // Other countries use TrustHub API
                console.log('Using TrustHub API for non-AU countries...');
                const policies = await targetClient.trusthub.v1.policies.list({ limit: 20 });
                console.log('Available policies:', policies.map(p => ({ sid: p.sid, name: p.friendlyName })));

                // Select the appropriate policy based on country
                let selectedPolicy;

                if (country === 'US') {
                    selectedPolicy = policies.find(p =>
                        p.friendlyName?.includes('A2P') ||
                        p.friendlyName?.includes('Primary Business')
                    );
                } else if (country === 'IE') {
                    selectedPolicy = policies.find(p => p.friendlyName === 'Ireland: Mobile - Business');
                } else if (country === 'BR') {
                    selectedPolicy = policies.find(p => p.friendlyName === 'Brazil: Mobile - Business');
                }

                const policySid = selectedPolicy?.sid || policies[0]?.sid;

                if (!policySid) {
                    throw new Error('No TrustHub policies available for this account');
                }

                console.log(`Selected policy for ${country}: ${selectedPolicy?.friendlyName || policies[0]?.friendlyName} (${policySid})`);

                bundle = await targetClient.trusthub.v1.trustProducts.create({
                    friendlyName: `${businessName} - Regulatory Bundle`,
                    email: formData.get("email") as string,
                    policySid: policySid,
                    statusCallback: ''
                });
                console.log(`Bundle created successfully: ${bundle.sid}`);
            }
        } catch (bundleError: any) {
            console.error('Bundle creation failed:', {
                message: bundleError.message,
                code: bundleError.code,
                moreInfo: bundleError.moreInfo,
                details: bundleError.details
            });
            throw new Error(`Failed to create bundle: ${bundleError.message}`);
        }


        // Assign items to bundle - Different API based on country
        if (country === 'AU') {
            // Australia uses Regulatory Compliance API
            // primary_customer_profile_bundle_australia requires EndUser AND Supporting Documents
            console.log('Assigning EndUser and documents using Regulatory Compliance API...');

            // Assign EndUser (REQUIRED for Australian bundles)
            await targetClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid)
                .itemAssignments.create({ objectSid: endUser.sid });

            // Assign Supporting Documents
            if (docIds['businessDoc']) {
                await targetClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid)
                    .itemAssignments.create({ objectSid: docIds['businessDoc'] });
            }
            if (docIds['addressDoc']) {
                await targetClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid)
                    .itemAssignments.create({ objectSid: docIds['addressDoc'] });
            }
            if (docIds['repDoc']) {
                await targetClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid)
                    .itemAssignments.create({ objectSid: docIds['repDoc'] });
            }
        } else {
            // Other countries use TrustHub API
            console.log('Assigning items using TrustHub API...');

            // Assign End User to TrustHub Bundle
            await targetClient.trusthub.v1.trustProducts(bundle.sid)
                .trustProductsEntityAssignments.create({ objectSid: endUser.sid });

            // Assign Address to TrustHub Bundle
            await targetClient.trusthub.v1.trustProducts(bundle.sid)
                .trustProductsEntityAssignments.create({ objectSid: address.sid });

            // Assign Documents to TrustHub Bundle
            if (docIds['businessDoc']) {
                await targetClient.trusthub.v1.trustProducts(bundle.sid)
                    .trustProductsEntityAssignments.create({ objectSid: docIds['businessDoc'] });
            }
            if (docIds['addressDoc']) {
                await targetClient.trusthub.v1.trustProducts(bundle.sid)
                    .trustProductsEntityAssignments.create({ objectSid: docIds['addressDoc'] });
            }
            if (docIds['repDoc']) {
                await targetClient.trusthub.v1.trustProducts(bundle.sid)
                    .trustProductsEntityAssignments.create({ objectSid: docIds['repDoc'] });
            }
        }

        // 7. Submit Bundle for Review - Different API based on country
        let submitted;
        try {
            if (country === 'AU') {
                submitted = await targetClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid)
                    .update({ status: 'pending-review' });
            } else {
                submitted = await targetClient.trusthub.v1.trustProducts(bundle.sid)
                    .update({ status: 'pending-review' });
            }
        } catch (submissionError: any) {
            // If submission fails, fetch the evaluation to see what's missing
            console.error('Bundle submission failed:', submissionError.message);

            if (country === 'AU') {
                try {
                    const evaluations = await targetClient.numbers.v2.regulatoryCompliance
                        .bundles(bundle.sid)
                        .evaluations.list({ limit: 1 });

                    if (evaluations.length > 0) {
                        const evaluation = evaluations[0];
                        console.error('Bundle Evaluation Results:', {
                            status: evaluation.status,
                            results: evaluation.results
                        });
                        throw new Error(`Bundle validation failed: ${JSON.stringify(evaluation.results)}`);
                    }
                } catch (evalError) {
                    console.error('Could not fetch evaluation:', evalError);
                }
            }

            throw submissionError;
        }

        // 8. Send SMS Notification (Approvals are manual, so we notify on SUBMISSION for now,
        // or setup a StatusCallback. Since StatusCallback requires a public URL webhook, 
        // for this "One-Click" tool we can just notify that it WAS submitted).
        // The user asked for "when the bundle has been successfully approved".
        // Twilio Bundles take 24-48h. We cannot know *immediately* here.
        // However, I will send a confirmation SMS that it was SUBMITTED.
        // To confirm "Approval", we would need a webhook.
        // Getting a webhook to localhost requires ngrok.
        // I will add the logic to send an SMS *now* saying it is "Submitted for Approval".

        // 8. SMS removed from here (User requested SMS only on Approval, not Submission)

        return NextResponse.json({
            success: true,
            bundleSid: submitted.sid,
            subAccountSid: targetAccountSid,
            status: submitted.status
        });

    } catch (error: any) {
        console.error("Workflow Error Details:", {
            message: error.message,
            code: error.code,
            moreInfo: error.moreInfo,
            status: error.status,
            stack: error.stack
        });

        // Return more detailed error message
        const errorMessage = error.code
            ? `Twilio Error ${error.code}: ${error.message}${error.moreInfo ? ` (${error.moreInfo})` : ''}`
            : error.message || 'An unknown error occurred';

        return NextResponse.json({
            success: false,
            error: errorMessage,
            details: error.code ? { code: error.code, moreInfo: error.moreInfo } : undefined
        }, { status: 500 });
    }
}
