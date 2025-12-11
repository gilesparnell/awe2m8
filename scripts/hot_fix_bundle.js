const twilio = require('twilio');
const fs = require('fs');
const path = require('path');
const https = require('https');

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
const TARGET_SID = process.env.TARGET_ACCOUNT_SID;
const BROKEN_BUNDLE_SID = 'BUd6e3fd542333bf2f64e400763b597603';
const DEAD_ADDRESS_SID = 'AD354867fce4434369e12588c8cd62c07a';
const VALID_ADDRESS_SID = 'AD4a1b21f477301181fa81b0d1dcbd92b5'; // We created this earlier

async function run() {
    console.log('--- Fixing Bundle by Cloning & Swapping Address ---');

    const masterClient = twilio(ACCOUNT_SID, AUTH_TOKEN);
    // Get Target Auth
    const subAccount = await masterClient.api.v2010.accounts(TARGET_SID).fetch();
    const targetClient = twilio(TARGET_SID, subAccount.authToken);
    const targetAuth = Buffer.from(`${TARGET_SID}:${subAccount.authToken}`).toString('base64');

    try {
        // 1. Clone the Broken Bundle (Same Account)
        console.log(`Cloning ${BROKEN_BUNDLE_SID}...`);
        const clone = await targetClient.numbers.v2.regulatoryCompliance.bundles.create({
            friendlyName: 'Fixed AWE2M8 Bundle (Address Swap)',
            email: 'giles@awe2m8.com',
            copyBundleSid: BROKEN_BUNDLE_SID,
            isoCountry: 'AU', // Required even for cloning apparently
            numberType: 'mobile',
            endUserType: 'business'
        });
        console.log(`✅ Cloned SID: ${clone.sid} (${clone.status})`);

        // 2. Find and Remove the Broken Document
        const items = await targetClient.numbers.v2.regulatoryCompliance.bundles(clone.sid).itemAssignments.list();
        for (const item of items) {
            if (item.objectSid.startsWith('RD')) {
                const doc = await targetClient.numbers.v2.regulatoryCompliance.supportingDocuments(item.objectSid).fetch();
                // Check if this doc links to the dead address
                if (doc.attributes && doc.attributes.address_sids && doc.attributes.address_sids.includes(DEAD_ADDRESS_SID)) {
                    console.log(`Found Broken Doc: ${doc.sid} (${doc.friendlyName})`);
                    console.log('Removing from clone...');
                    await targetClient.numbers.v2.regulatoryCompliance.bundles(clone.sid).itemAssignments(item.sid).remove();
                    console.log('✅ Removed.');
                }
            }
        }

        // 3. Upload NEW Address Proof linked to VALID Address
        console.log(`Uploading replacement doc for Address ${VALID_ADDRESS_SID}...`);

        const uploadDoc = () => new Promise((resolve, reject) => {
            const filePath = path.resolve(__dirname, '../public/admin/documents/AWE2M8 Business Address.pdf');
            const fileName = path.basename(filePath);
            const boundary = 'TwilioBoundary' + Math.random().toString(16);

            const fileContent = fs.readFileSync(filePath);

            const parts = [
                `--${boundary}`, `Content-Disposition: form-data; name="FriendlyName"`, '', 'AWE2M8 Correct Address Proof',
                `--${boundary}`, `Content-Disposition: form-data; name="Type"`, '', 'utility_bill',
                `--${boundary}`, `Content-Disposition: form-data; name="Attributes"`, '', JSON.stringify({ address_sids: [VALID_ADDRESS_SID] }),
                `--${boundary}`, `Content-Disposition: form-data; name="File"; filename="${fileName}"`, `Content-Type: application/pdf`, '', ''
            ];

            const body = Buffer.concat([Buffer.from(parts.join('\r\n')), fileContent, Buffer.from(`\r\n--${boundary}--`)]);

            const req = https.request({
                hostname: 'numbers.twilio.com',
                path: '/v2/RegulatoryCompliance/SupportingDocuments',
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${targetAuth}`,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': body.length
                }
            }, res => {
                let data = ''; res.on('data', c => data += c);
                res.on('end', () => {
                    if (res.statusCode < 300) resolve(JSON.parse(data).sid);
                    else reject(new Error(data));
                });
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        });

        const newDocSid = await uploadDoc();
        console.log(`✅ New Doc Created: ${newDocSid}`);

        // 4. Assign New Doc
        await targetClient.numbers.v2.regulatoryCompliance.bundles(clone.sid).itemAssignments.create({
            objectSid: newDocSid
        });
        console.log('✅ Assigned to Clone.');

        // 5. Submit Clone
        console.log('Submitting Clone...');
        const submitted = await targetClient.numbers.v2.regulatoryCompliance.bundles(clone.sid).update({
            status: 'pending-review'
        });
        console.log(`Status: ${submitted.status}`);

        // 6. Attempt Port IMMEDIATELY
        console.log('Attempting Port with Fixed Clone...');
        const SOURCE_SID = process.env.SOURCE_ACCOUNT_SID;
        const PHONE_SID = 'PNf5c2d825721cab8f4df2bd7f5d3d8c50';

        try {
            const result = await masterClient.api.v2010.accounts(SOURCE_SID)
                .incomingPhoneNumbers(PHONE_SID)
                .update({
                    accountSid: TARGET_SID,
                    addressSid: VALID_ADDRESS_SID,
                    bundleSid: submitted.sid
                });
            console.log('🎉 PORT SUCCESSFUL! The clone worked!');
        } catch (e) {
            console.error(`Port failed (likely pending status): ${e.message}`);
        }

    } catch (e) {
        console.error('Script Error:', e);
    }
}

run();
