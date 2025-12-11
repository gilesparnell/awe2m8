const fs = require('fs');
const path = require('path');
const https = require('https');
const twilio = require('twilio');

// Load Env
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

if (!ACCOUNT_SID || !AUTH_TOKEN) { console.error('Missing Creds'); process.exit(1); }

async function run() {
    console.log('--- Creating Bundle Logic (Final) ---');

    const masterClient = twilio(ACCOUNT_SID, AUTH_TOKEN);

    // 1. Get Subaccount Auth Token
    console.log('Fetching Subaccount Token...');
    const subAccount = await masterClient.api.v2010.accounts(TARGET_SUBACCOUNT_SID).fetch();
    const subAuthToken = subAccount.authToken;
    console.log('Subaccount Token Retrieved.');

    // 2. Client for Subaccount (official SDK for non-upload tasks)
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN, { accountSid: TARGET_SUBACCOUNT_SID });

    // 3. Get Address SID
    console.log('Getting Address SID...');
    const addresses = await client.addresses.list({ customerName: 'AWE2M8 Pty Ltd', limit: 1 });
    if (addresses.length === 0) throw new Error('Address not found in target account');
    const addressSid = addresses[0].sid;
    console.log(`Using Address SID: ${addressSid}`);

    // 4. Upload Helper (Correctly using Subaccount Auth)
    const subAuth = Buffer.from(`${TARGET_SUBACCOUNT_SID}:${subAuthToken}`).toString('base64');

    async function uploadAsSubaccount(friendlyName, type, attributes, filePath) {
        return new Promise((resolve, reject) => {
            console.log(`[Upload] ${friendlyName}...`);
            const fileContent = fs.readFileSync(filePath);
            const fileName = path.basename(filePath);
            const boundary = '----TwilioUploadBoundary' + Math.random().toString(16);

            const postDataStart = [
                `--${boundary}`,
                `Content-Disposition: form-data; name="FriendlyName"`, '', friendlyName,
                `--${boundary}`,
                `Content-Disposition: form-data; name="Type"`, '', type,
                `--${boundary}`,
                `Content-Disposition: form-data; name="Attributes"`, '', JSON.stringify(attributes),
                `--${boundary}`,
                `Content-Disposition: form-data; name="File"; filename="${fileName}"`, `Content-Type: application/pdf`, '', ''
            ].join('\r\n');
            const postDataEnd = `\r\n--${boundary}--`;

            const options = {
                hostname: 'numbers.twilio.com', port: 443, path: `/v2/RegulatoryCompliance/SupportingDocuments`, method: 'POST',
                headers: {
                    'Authorization': `Basic ${subAuth}`,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': Buffer.byteLength(postDataStart) + fileContent.length + Buffer.byteLength(postDataEnd)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try { resolve(JSON.parse(data).sid); } catch (e) { reject(e); }
                    } else {
                        console.error('Upload Failed:', data);
                        reject(new Error(data));
                    }
                });
            });
            req.on('error', reject);
            req.write(Buffer.concat([Buffer.from(postDataStart), fileContent, Buffer.from(postDataEnd)]));
            req.end();
        });
    }

    try {
        // Upload Docs
        const regSid = await uploadAsSubaccount(
            'AWE2M8 Registration',
            'commercial_registrar_excerpt',
            { business_name: 'AWE2M8 Pty Ltd' },
            path.resolve(__dirname, '../public/admin/documents/AWE2M8 Company Registration.pdf')
        );
        console.log(`Reg Doc SID: ${regSid}`);

        const addrDocSid = await uploadAsSubaccount(
            'AWE2M8 Address Proof',
            'utility_bill',
            { address_sids: [addressSid] }, // Linked to the Address Resource!
            path.resolve(__dirname, '../public/admin/documents/AWE2M8 Business Address.pdf')
        );
        console.log(`Addr Doc SID: ${addrDocSid}`);

        // Create End User
        console.log('Creating End User...');
        const endUser = await client.numbers.v2.regulatoryCompliance.endUsers.create({
            friendlyName: 'AWE2M8 Pty Ltd',
            type: 'business',
            attributes: JSON.stringify({
                business_name: 'AWE2M8 Pty Ltd',
                // business_type: 'corporation',
                // business_registration_identifier: '31687348134', // ABN
                // business_identity: 'direct_customer',
                // business_industry: 'TECHNOLOGY',
                // website: 'https://awe2m8.com',
                // business_address: '50a Habitat Way',
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
        console.log(`EndUser SID: ${endUser.sid}`);

        // Create Bundle
        console.log('Creating Bundle...');
        const bundle = await client.numbers.v2.regulatoryCompliance.bundles.create({
            friendlyName: 'AWE2M8 Migration Bundle',
            email: 'giles@awe2m8.com',
            status: 'draft',
            endUserType: 'business',
            regulationSid: 'RNede12e527be2628b51290c0187de7ee4', // Australia Mobile Business
        });
        console.log(`Bundle SID: ${bundle.sid}`);

        // Assign
        console.log('Assigning Items...');
        await client.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: endUser.sid });
        await client.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: regSid });
        await client.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: addrDocSid });

        // Submit
        console.log('Submitting Bundle...');
        const submitted = await client.numbers.v2.regulatoryCompliance.bundles(bundle.sid).update({ status: 'pending-review' });
        console.log(`Bundle Status: ${submitted.status}`);

    } catch (err) {
        console.error('FATAL:', err);
    }
}

run();
