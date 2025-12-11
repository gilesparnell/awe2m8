const twilio = require('twilio');
const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

// Load Env for Master Creds
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        if (line.trim().startsWith('#')) return;
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    });
}

const MASTER_SID = process.env.TWILIO_ACCOUNT_SID;
const MASTER_TOKEN = process.env.TWILIO_AUTH_TOKEN;

const masterClient = twilio(MASTER_SID, MASTER_TOKEN);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function getAnswer(q) {
    return new Promise(r => rl.question(q, r));
}

async function run() {
    console.log('\n🇦🇺 AWE2M8 AU Subaccount Setup Wizard 🇦🇺');
    console.log('----------------------------------------');
    console.log('This script will configure a FRESH subaccount for AU Mobile Porting.');
    console.log('It creates: 1. Address, 2. EndUser, 3. Supporting Docs, 4. Regulatory Bundle.\n');

    const targetSid = await getAnswer('Enter the NEW Subaccount SID (AC...): ');

    if (!targetSid.startsWith('AC')) {
        console.error('Invalid SID. Exiting.');
        process.exit(1);
    }

    console.log(`\nConfiguring Subaccount: ${targetSid}...`);

    // 1. Authenticate as Subaccount
    console.log('Fetching auth token...');
    const sub = await masterClient.api.v2010.accounts(targetSid).fetch();
    const client = twilio(targetSid, sub.authToken); // Scoped Client
    const subAuth = Buffer.from(`${targetSid}:${sub.authToken}`).toString('base64');

    try {
        // 2. Create Address
        console.log('\n[1/4] Creating Address Resource...');
        const address = await client.addresses.create({
            customerName: 'AWE2M8 Pty Ltd',
            street: '50a Habitat Way',
            city: 'Lennox Head',
            region: 'NSW',
            postalCode: '2478',
            isoCountry: 'AU',
            emergencyEnabled: false,
            friendlyName: 'AWE2M8 Business Address'
        });
        console.log(`✅ Address Created: ${address.sid}`);

        // 3. Helper for Document Upload
        const upload = (name, type, attrs, filename) => new Promise((resolve, reject) => {
            console.log(`      Uploading ${filename}...`);
            const filePath = path.resolve(__dirname, `../public/admin/documents/${filename}`);
            if (!fs.existsSync(filePath)) reject(new Error(`File not found: ${filePath}`));

            const boundary = 'Twilio' + Math.random().toString(16);
            const content = fs.readFileSync(filePath);
            const parts = [
                `--${boundary}`, `Content-Disposition: form-data; name="FriendlyName"`, '', name,
                `--${boundary}`, `Content-Disposition: form-data; name="Type"`, '', type,
                `--${boundary}`, `Content-Disposition: form-data; name="Attributes"`, '', JSON.stringify(attrs),
                `--${boundary}`, `Content-Disposition: form-data; name="File"; filename="${filename}"`, `Content-Type: application/pdf`, '', ''
            ];
            const body = Buffer.concat([Buffer.from(parts.join('\r\n')), content, Buffer.from(`\r\n--${boundary}--`)]);

            const req = https.request({
                hostname: 'numbers.twilio.com', path: '/v2/RegulatoryCompliance/SupportingDocuments', method: 'POST',
                headers: { 'Authorization': `Basic ${subAuth}`, 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length }
            }, r => {
                let d = ''; r.on('data', c => d += c);
                r.on('end', () => {
                    if (r.statusCode < 300) resolve(JSON.parse(d).sid);
                    else reject(new Error(`Upload Failed: ${d}`));
                });
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        });

        // 4. upload Docs
        console.log('\n[2/4] Uploading Supporting Documents...');
        const regDocSid = await upload(
            'AWE2M8 Registration',
            'commercial_registrar_excerpt',
            { business_name: 'AWE2M8 Pty Ltd', document_number: '31687348134' },
            'AWE2M8 Company Registration.pdf'
        );
        console.log(`✅ Reg Doc: ${regDocSid}`);

        const addrDocSid = await upload(
            'AWE2M8 Address Proof',
            'utility_bill',
            { address_sids: [address.sid] }, // Link to correct address
            'AWE2M8 Business Address.pdf'
        );
        console.log(`✅ Addr Doc: ${addrDocSid}`);

        // 5. Create End User
        console.log('\n[3/4] Creating End User...');
        const endUser = await client.numbers.v2.regulatoryCompliance.endUsers.create({
            friendlyName: 'AWE2M8 Pty Ltd',
            type: 'business',
            attributes: JSON.stringify({
                business_name: 'AWE2M8 Pty Ltd',
                business_type: 'corporation',
                business_registration_identifier: '31687348134',
                business_identity: 'direct_customer',
                business_industry: 'TECHNOLOGY',
            })
        });
        console.log(`✅ End User: ${endUser.sid}`);

        // 6. Create Bundle
        console.log('\n[4/4] Creating & Submitting Bundle...');
        const bundle = await client.numbers.v2.regulatoryCompliance.bundles.create({
            friendlyName: 'AWE2M8 Mobile Porting Bundle',
            email: 'giles@awe2m8.com',
            status: 'draft',
            endUserType: 'business',
            isoCountry: 'AU',
            numberType: 'mobile'
        });

        await client.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: endUser.sid });
        await client.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: regDocSid });
        await client.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: addrDocSid });

        const submitted = await client.numbers.v2.regulatoryCompliance.bundles(bundle.sid).update({
            status: 'pending-review'
        });

        console.log('----------------------------------------');
        console.log(`🎉 SUCCESS! Bundle Created: ${bundle.sid}`);
        console.log(`STATUS: ${submitted.status}`);
        console.log('----------------------------------------');
        console.log('NOTE: AU Business Bundles typically take 24-48h to approve.');
        console.log('Once approved, use the following details to port your number:');
        console.log(`Target Address SID: ${address.sid}`);
        console.log(`Target Bundle SID:  ${bundle.sid}`);

        process.exit(0);

    } catch (e) {
        console.error('\n❌ SETUP FAILED:', e.message);
        console.error(e);
        process.exit(1);
    }
}

run();
