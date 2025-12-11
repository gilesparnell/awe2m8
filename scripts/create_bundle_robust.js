const twilio = require('twilio');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Load Environment Variables
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        if (line.trim().startsWith('#')) return;
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    });
}

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TARGET_SUBACCOUNT_SID = process.env.TARGET_ACCOUNT_SID;

// Helper: Sleep
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
    console.log('--- Robust Bundle Creation ---');

    // 2. Get Subaccount Auth Token
    console.log('Fetching Subaccount Token...');
    const masterClient = twilio(ACCOUNT_SID, AUTH_TOKEN);
    let subAuthToken;
    try {
        const subAccount = await masterClient.api.v2010.accounts(TARGET_SUBACCOUNT_SID).fetch();
        subAuthToken = subAccount.authToken;
        console.log('✅ Token Retrieved');
    } catch (e) {
        console.error('❌ Failed to get subaccount token:', e.message);
        process.exit(1);
    }

    // 3. Authenticate as Subaccount
    const subClient = twilio(TARGET_SUBACCOUNT_SID, subAuthToken);
    const subAuth = Buffer.from(`${TARGET_SUBACCOUNT_SID}:${subAuthToken}`).toString('base64');

    // 4. Get Address SID (Required for AU Address Proof)
    console.log('Finding Address...');
    const addresses = await subClient.addresses.list({ customerName: 'AWE2M8 Pty Ltd', limit: 1 });
    if (addresses.length === 0) {
        throw new Error('Address not found. Please run fix_port_address.js');
    }
    const addressSid = addresses[0].sid;
    console.log(`✅ Using Address SID: ${addressSid}`);

    // 5. Upload Function (Direct Multipart)
    async function uploadDoc(friendlyName, type, attributes, filePath) {
        return new Promise((resolve, reject) => {
            console.log(`[Upload] ${friendlyName} (${type})...`);
            try {
                const fileContent = fs.readFileSync(filePath);
                const fileName = path.basename(filePath);
                const boundary = '----TwilioBoundary' + Math.random().toString(16);

                const parts = [
                    `--${boundary}`, `Content-Disposition: form-data; name="FriendlyName"`, '', friendlyName,
                    `--${boundary}`, `Content-Disposition: form-data; name="Type"`, '', type,
                    `--${boundary}`, `Content-Disposition: form-data; name="Attributes"`, '', JSON.stringify(attributes),
                    `--${boundary}`, `Content-Disposition: form-data; name="File"; filename="${fileName}"`, `Content-Type: application/pdf`, '', ''
                ];
                const body = Buffer.concat([
                    Buffer.from(parts.join('\r\n')),
                    fileContent,
                    Buffer.from(`\r\n--${boundary}--`)
                ]);

                const req = https.request({
                    hostname: 'numbers.twilio.com',
                    path: '/v2/RegulatoryCompliance/SupportingDocuments',
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${subAuth}`,
                        'Content-Type': `multipart/form-data; boundary=${boundary}`,
                        'Content-Length': body.length
                    }
                }, res => {
                    let data = '';
                    res.on('data', c => data += c);
                    res.on('end', () => {
                        if (res.statusCode < 300) {
                            try { resolve(JSON.parse(data).sid); } catch (e) { reject(e); }
                        } else {
                            reject(new Error(`Upload Failed: ${res.statusCode} ${data}`));
                        }
                    });
                });
                req.on('error', reject);
                req.write(body);
                req.end();
            } catch (e) { reject(e); }
        });
    }

    try {
        // 6. Upload Documents
        const regSid = await uploadDoc(
            'AWE2M8 Registration',
            'commercial_registrar_excerpt',
            {
                business_name: 'AWE2M8 Pty Ltd',
                document_number: '31687348134' // Required for Business ID Number check
            },
            path.resolve(__dirname, '../public/admin/documents/AWE2M8 Company Registration.pdf')
        );
        console.log(`✅ Reg Doc: ${regSid}`);

        const addrDocSid = await uploadDoc(
            'AWE2M8 Address Proof',
            'utility_bill',
            { address_sids: [addressSid] },
            path.resolve(__dirname, '../public/admin/documents/AWE2M8 Business Address.pdf')
        );
        console.log(`✅ Addr Doc: ${addrDocSid}`);

        // 7. Create EndUser
        console.log('Creating EndUser...');
        const endUser = await subClient.numbers.v2.regulatoryCompliance.endUsers.create({
            friendlyName: 'AWE2M8 Pty Ltd',
            type: 'business',
            attributes: JSON.stringify({
                business_name: 'AWE2M8 Pty Ltd',
                business_type: 'corporation',
                business_registration_identifier: '31687348134', // ABN
                business_identity: 'direct_customer',
                business_industry: 'TECHNOLOGY',
                // website: 'https://awe2m8.com', // NOT Allowed for AU Business EndUser (it seems)
                // business_address: '50a Habitat Way', // NOT Allowed (Address is separate)
                // business_city: 'Lennox Head',
                // business_state_province_region: 'NSW',
                // business_postal_code: '2478',
                // business_country: 'AU',
                // first_name: 'Jesse', 
                // last_name: 'Allan',
                // email: 'giles@awe2m8.com',
                // phone_number: '+61412345678'
            })
        });
        console.log(`✅ EndUser: ${endUser.sid}`);

        // 8. Create Bundle
        console.log('Creating Bundle...');
        const bundle = await subClient.numbers.v2.regulatoryCompliance.bundles.create({
            friendlyName: 'AWE2M8 Migration Bundle',
            email: 'giles@awe2m8.com',
            status: 'draft',
            endUserType: 'business',
            regulationSid: 'RNede12e527be2628b51290c0187de7ee4' // AU Mobile Business
        });
        console.log(`✅ Bundle: ${bundle.sid}`);

        // 9. Assign Items with Retry
        async function assignItem(itemSid) {
            let retries = 5;
            while (retries > 0) {
                try {
                    await subClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid)
                        .itemAssignments.create({ objectSid: itemSid });
                    console.log(`  Assigned ${itemSid}`);
                    return;
                } catch (e) {
                    if (e.code === 70002 || e.status === 404) { // Not Found
                        console.log(`  Item ${itemSid} not found yet, retrying...`);
                        await sleep(2000);
                        retries--;
                    } else {
                        throw e;
                    }
                }
            }
            throw new Error(`Failed to assign ${itemSid} after retries`);
        }

        console.log('Assigning items (with retry)...');
        await assignItem(endUser.sid);
        await assignItem(regSid);
        await assignItem(addrDocSid);

        // 10. Submit
        console.log('Submitting Bundle...');
        const submitted = await subClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid)
            .update({ status: 'pending-review' });

        console.log(`✅ Bundle Status: ${submitted.status}`);

        // 11. Attempt Porting Logic (from Master Client) directly here?
        // If status is pending-review, porting might still block on 'approved bundle required', but let's check.
        // Actually, we must use the Master Client to Update the number.

        console.log('Attempting Port now...');
        try {
            const masterClientForPort = twilio(ACCOUNT_SID, AUTH_TOKEN);
            const SOURCE_SID = process.env.SOURCE_ACCOUNT_SID;
            const PHONE_SID = 'PNf5c2d825721cab8f4df2bd7f5d3d8c50'; // From earlier logs

            // NOTE: When porting, if we just set accountSid, Twilio looks for an approved bundle.
            // If we want to assign THIS bundle, can we? 
            // Usually, we just ensure the bundle exists in the target account. 
            // BUT it needs to be approved.
            // If it's pending review, it might fail.

            await masterClientForPort.api.v2010.accounts(SOURCE_SID)
                .incomingPhoneNumbers(PHONE_SID)
                .update({
                    accountSid: TARGET_SUBACCOUNT_SID,
                    addressSid: addressSid, // also link address
                    bundleSid: bundle.sid // Can we pass bundleSid?
                    // Documentation says 'bundleSid' parameter exists for IncomingPhoneNumber Update?
                    // "The SID of the Bundle resource that you want to associate with the number."
                });
            console.log('🎉 PORT SUCCESSFUL!');

        } catch (portErr) {
            console.log('Port failed (expected if bundle not approved):');
            console.log(portErr.message);
            if (portErr.code === 21649) {
                console.log('WAIT for Bundle Approval, then retry.');
            }
        }

    } catch (err) {
        console.error('Script Failed:', err);
    }
}

run();
