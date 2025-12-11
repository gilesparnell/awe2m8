const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

// 1. Load Env
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        if (line.trim().startsWith('#')) return;
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            let val = match[2].trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
            process.env[match[1].trim()] = val;
        }
    });
}

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TARGET_SUBACCOUNT_SID = process.env.TARGET_ACCOUNT_SID;

if (!ACCOUNT_SID || !AUTH_TOKEN) { console.error('Missing Creds'); process.exit(1); }

const client = twilio(ACCOUNT_SID, AUTH_TOKEN, { accountSid: TARGET_SUBACCOUNT_SID });

// Business Info
const BUSINESS = {
    friendlyName: 'AWE2M8 Pty Ltd',
    type: 'business',
    attributes: {
        business_name: 'AWE2M8 Pty Ltd',
        business_type: 'corporation',
        business_registration_identifier: '31687348134', // ABN
        business_identity: 'direct_customer',
        business_industry: 'TECHNOLOGY',
        website: 'https://awe2m8.com',
        business_address: '50a Habitat Way',
        business_city: 'Lennox Head',
        business_state_province_region: 'NSW',
        business_postal_code: '2478',
        business_country: 'AU',
        first_name: 'Jesse',
        last_name: 'Allan',
        email: 'giles@awe2m8.com',
        phone_number: '+61412345678'
    }
};

async function uploadFile(filePath, friendlyName) {
    console.log(`Uploading ${friendlyName}...`);
    // Note: Twilio Node SDK helper for creating documents isn't always straightforward with streams in all versions, 
    // but client.numbers.v2.regulatoryCompliance.supportingDocuments.create supports 'file' as url or stream? 
    // Actually, it usually expects a URL or binary.
    // Let's use the API strictly.

    // NOTE: For 'create', the SDK might behave differently. 
    // The official way is passing attributes. But for binaries, we need to create the document object first? 
    // Actually, Twilio API allows 'create' with type and attributes.
    // Wait, binary upload is separate? No, 'create' takes 'file' parameters?
    // Let's check documentation logic: Document creation usually requires a type and attributes.

    // Simplification: We will try to create the document entry. 
    // CAUTION: The SDK for `supportingDocuments.create` takes `attributes` (json). To upload the FILE itself, 
    // we often need to providing a URL or strict binary.

    // Strategy: We will assume we can pass the local file stream if the SDK supports it.
    // If not, this might fail and we would need a public URL.
    // BUT since we are local, we can't easily give a public URL.
    // Let's attempt to pass the file stream.

    // Correction: Twilio supporting_documents API requires 'Attributes' but validation is tricky.
    // Actually, to upload the binary, we specifically need the 'create' endpoint with formData. 
    // The node library handles this if we pass the correct params.

    // Let's try to map the types to what we saw in the UI code:
    // UI used `businessDoc` and `addressDoc`.

    return null; // Placeholder logic below will handle it manually.
}

async function run() {
    console.log('--- Starting Bundle Creation in Target ---');

    try {
        // 1. Create End User
        console.log('Creating End User...');
        const endUser = await client.numbers.v2.regulatoryCompliance.endUsers.create({
            friendlyName: BUSINESS.friendlyName,
            type: 'business',
            attributes: JSON.stringify(BUSINESS.attributes)
        });
        console.log(`✅ End User Created: ${endUser.sid}`);

        // 2. Upload Documents
        // Since uploading binary via Node SDK can be tricky without a public URL, 
        // and we have them locally, we need to ensure we do this right.
        // We will read the file as base64? No, SDK usually handles streams.
        // Let's try the standard approach.

        console.log('uploading documents...');

        // Doc 1: Business Registration
        // Type: business_registration_document
        const regFile = fs.createReadStream(path.resolve(__dirname, '../public/admin/documents/AWE2M8 Company Registration.pdf'));
        const regDoc = await client.numbers.v2.regulatoryCompliance.supportingDocuments.create({
            friendlyName: 'AWE2M8 Registration',
            type: 'business_registration_document',
            attributes: JSON.stringify({ business_name: 'AWE2M8 Pty Ltd' })
            // NOTE: Some types need specific attributes
        });

        // Wait, 'create' above only creates metadata? NO, we need to create with the file?
        // Actually, the API has a separation often. 
        // Let's try to find if we can strictly upload. 
        // If the 'create' method doesn't accept a stream, we are in trouble.
        // ... Checking SDK ... The SDK for `supportingDocuments.create` does NOT support file upload directly in all versions.
        // BUT, we can use `client.request` to do a raw multipart post if needed.
        // However, modern SDKs might support it.

        // Let's pause on the upload. If we fail to upload valid docs, the bundle fails.
        // ALTERNATIVE: Can we reference the documents from the SOURCE account?
        // Documents are Account-Scoped? Yes.

        // Let's try to use the raw request for uploading real files to be safe.
    } catch (e) {
        console.error('Setup Error:', e);
    }
}

// We will restart with a better script that handles the upload properly.
console.log('Script placeholder. Proceeding to write real script.');
