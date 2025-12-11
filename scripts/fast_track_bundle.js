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
const VALID_ADDRESS_SID = 'AD4a1b21f477301181fa81b0d1dcbd92b5';

async function run() {
    console.log('--- REBUILDING BUNDLE FROM SCRATCH (NO CLONING) ---');
    console.log('Reason: Cloning results in validation errors due to data loss.');

    // We created "BUf18c62d891c36a31143fac068e9207d6" earlier which was COMPLIANT but stuck in review.
    // The User wants "Immediate". 
    // Is there any specific EndUser ID we should reuse?
    // Maybe we should reuse the EndUser from the BROKEN bundle?
    // If we reuse an "Approved" EndUser, it skips EndUser review.

    const BROKEN_BUNDLE_SID = 'BUd6e3fd542333bf2f64e400763b597603';

    const masterClient = twilio(ACCOUNT_SID, AUTH_TOKEN);
    const subAccount = await masterClient.api.v2010.accounts(TARGET_SID).fetch();
    const targetClient = twilio(TARGET_SID, subAccount.authToken);
    const targetAuth = Buffer.from(`${TARGET_SID}:${subAccount.authToken}`).toString('base64');

    // 1. Get Approved EndUser from Broken Bundle
    let endUserSid;
    const items = await targetClient.numbers.v2.regulatoryCompliance.bundles(BROKEN_BUNDLE_SID).itemAssignments.list();
    for (const item of items) {
        if (item.objectSid.startsWith('IT')) {
            endUserSid = item.objectSid;
            console.log(`Found Approved EndUser: ${endUserSid}`);
        }
    }

    if (!endUserSid) throw new Error('Could not find EndUser in approved bundle.');

    // 2. We need NEW Documents, because old docs are linked to bad Address.
    // Upload Helper
    const upload = (name, type, attrs, file) => new Promise((resolve, reject) => {
        const filePath = path.resolve(__dirname, `../public/admin/documents/${file}`);
        const boundary = 'Twilio' + Math.random().toString(16);
        const content = fs.readFileSync(filePath);
        const parts = [
            `--${boundary}`, `Content-Disposition: form-data; name="FriendlyName"`, '', name,
            `--${boundary}`, `Content-Disposition: form-data; name="Type"`, '', type,
            `--${boundary}`, `Content-Disposition: form-data; name="Attributes"`, '', JSON.stringify(attrs),
            `--${boundary}`, `Content-Disposition: form-data; name="File"; filename="${file}"`, `Content-Type: application/pdf`, '', ''
        ];
        const body = Buffer.concat([Buffer.from(parts.join('\r\n')), content, Buffer.from(`\r\n--${boundary}--`)]);
        const req = https.request({
            hostname: 'numbers.twilio.com', path: '/v2/RegulatoryCompliance/SupportingDocuments', method: 'POST',
            headers: { 'Authorization': `Basic ${targetAuth}`, 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length }
        }, r => {
            let d = ''; r.on('data', c => d += c); r.on('end', () => {
                if (r.statusCode < 300) resolve(JSON.parse(d).sid); else reject(new Error(d));
            });
        });
        req.end(body);
    });

    // 3. Create Fresh Documents (With correct attributes)
    console.log('Uploading fresh documents...');

    const regDocSid = await upload(
        'AWE2M8 Registration Fresh',
        'commercial_registrar_excerpt',
        { business_name: 'AWE2M8 Pty Ltd', document_number: '31687348134' },
        'AWE2M8 Company Registration.pdf'
    );
    console.log(`Reg Doc: ${regDocSid}`);

    const addrDocSid = await upload(
        'AWE2M8 Address Proof Fresh',
        'utility_bill',
        { address_sids: [VALID_ADDRESS_SID] },
        'AWE2M8 Business Address.pdf'
    );
    console.log(`Addr Doc: ${addrDocSid}`);

    // 4. Create New Bundle (Using Approved EndUser + Fresh Docs)
    console.log('Creating optimized bundle...');
    const bundle = await targetClient.numbers.v2.regulatoryCompliance.bundles.create({
        friendlyName: 'AWE2M8 Fast Track Bundle',
        email: 'giles@awe2m8.com',
        status: 'draft',
        endUserType: 'business',
        isoCountry: 'AU', numberType: 'mobile'
    });
    console.log(`Bundle: ${bundle.sid}`);

    // 5. Assign Items
    await targetClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: endUserSid }); // REUSE APPROVED USER
    await targetClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: regDocSid });
    await targetClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: addrDocSid });

    // 6. Submit
    console.log('Submitting...');
    const submitted = await targetClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).update({ status: 'pending-review' });
    console.log(`Final Status: ${submitted.status}`);

    if (submitted.status === 'twilio-approved') {
        console.log('FAST TRACK SUCCESS! Porting...');
        const result = await masterClient.api.v2010.accounts(process.env.SOURCE_ACCOUNT_SID)
            .incomingPhoneNumbers('PNf5c2d825721cab8f4df2bd7f5d3d8c50')
            .update({
                accountSid: TARGET_SID,
                addressSid: VALID_ADDRESS_SID,
                bundleSid: submitted.sid
            });
        console.log(`PORT DONE: ${result.sid}`);
    } else {
        console.log('Still pending review. Reusing the EndUser was the best shot.');
    }
}

run();
