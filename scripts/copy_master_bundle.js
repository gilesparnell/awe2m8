const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

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
const MASTER_BUNDLE_SID = 'BU087706e39868c7ca75418fc37e28b3a5'; // Found in Master

async function run() {
    console.log(`cloning Master Bundle ${MASTER_BUNDLE_SID} to Target ${TARGET_SID}...`);

    // We need to act as Target to CREATE the bundle there.
    // We hope Target can see Master Bundle via 'copyBundleSid' or we use Master Client to Create in Target?

    // Strategy A: Authenticate as Target, reference Master Bundle.
    // Strategy B: Authenticate as Master, Create Bundle (accountSid=Target), reference Master Bundle. (Likely Best)

    const masterClient = twilio(ACCOUNT_SID, AUTH_TOKEN);
    // Client strictly for creating resources IN target
    const targetCreator = twilio(ACCOUNT_SID, AUTH_TOKEN, { accountSid: TARGET_SID });

    try {
        console.log('Attempting copy...');
        const copied = await targetCreator.numbers.v2.regulatoryCompliance.bundles.create({
            friendlyName: 'Porting Copy from Master',
            email: 'giles@awe2m8.com',
            copyBundleSid: MASTER_BUNDLE_SID,
            isoCountry: 'AU',
            numberType: 'mobile',
            endUserType: 'business'
        });

        console.log(`✅ Copied! New Bundle SID: ${copied.sid}`);
        console.log(`Status: ${copied.status}`);

        if (copied.status === 'draft') {
            console.log('Submitting...');
            const submitted = await targetCreator.numbers.v2.regulatoryCompliance.bundles(copied.sid)
                .update({ status: 'pending-review' });
            console.log(`New Status: ${submitted.status}`);

            if (submitted.status === 'twilio-approved') {
                console.log('AUTO-APPROVED! Proceeding to Port...');
                // Port Logic
                const SOURCE_SID = process.env.SOURCE_ACCOUNT_SID;
                const PHONE_SID = 'PNf5c2d825721cab8f4df2bd7f5d3d8c50';
                const ADDRESS_SID = 'AD4a1b21f477301181fa81b0d1dcbd92b5';

                const result = await masterClient.api.v2010.accounts(SOURCE_SID)
                    .incomingPhoneNumbers(PHONE_SID)
                    .update({
                        accountSid: TARGET_SID,
                        addressSid: ADDRESS_SID,
                        bundleSid: copied.sid
                    });
                console.log('🎉 PORT COMPLETE!');
            }
        }

    } catch (e) {
        console.error('Copy Failed:', e.code, e.message);

        if (e.code === 20404) {
            console.log('Detail: Target Account cannot see Master Bundle.');
        }
    }
}

run();
