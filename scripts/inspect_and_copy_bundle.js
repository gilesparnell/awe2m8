const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

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

// Config
const SOURCE_SID = process.env.SOURCE_ACCOUNT_SID;
const TARGET_SID = process.env.TARGET_ACCOUNT_SID;
const PHONE_NUMBER = '+61468170318';

async function run() {
    console.log('--- Strategy: Clone Existing Bundle ---');

    const masterClient = twilio(ACCOUNT_SID, AUTH_TOKEN);
    const sourceClient = twilio(ACCOUNT_SID, AUTH_TOKEN, { accountSid: SOURCE_SID });
    const targetClient = twilio(ACCOUNT_SID, AUTH_TOKEN, { accountSid: TARGET_SID });

    try {
        // 1. Find the Phone Number Resource to get its Bundle SID
        console.log(`Fetching number ${PHONE_NUMBER} in Source Account...`);
        const numbers = await sourceClient.incomingPhoneNumbers.list({ phoneNumber: PHONE_NUMBER, limit: 1 });

        if (numbers.length === 0) {
            console.error('Number not found in source!');
            return;
        }

        const phone = numbers[0];
        console.log(`Found Number SID: ${phone.sid}`);
        console.log(`Current Bundle SID: ${phone.bundleSid}`);

        let bundleToUse = phone.bundleSid;

        if (!bundleToUse) {
            console.log('⚠️ Number does not have an explicitly assigned Bundle SID.');
            console.log('Detailed fetch to be sure...');
            const phoneDetails = await sourceClient.incomingPhoneNumbers(phone.sid).fetch();
            console.log(`Refetched Bundle SID: ${phoneDetails.bundleSid}`);
            bundleToUse = phoneDetails.bundleSid;
        }

        if (!bundleToUse) {
            console.error('❌ No Bundle found on the source number. Cannot clone.');
            // Fallback: Check approved bundles in Source account generally?
            console.log('Checking for ANY approved bundles in Source...');
            const bundles = await sourceClient.numbers.v2.regulatoryCompliance.bundles.list({
                status: 'twilio-approved',
                isoCountry: 'AU',
                limit: 1
            });
            if (bundles.length > 0) {
                console.log(`Found an approved bundle in Source: ${bundles[0].sid}`);
                bundleToUse = bundles[0].sid;
            } else {
                console.error('No approved bundles found in Source to copy.');
                return;
            }
        }

        // 2. Copy the Bundle to Target
        console.log(`\nAttempting to COPY Bundle ${bundleToUse} to Target Account...`);

        // Note: The bundle copy API is technically checking regulation copies. 
        // We use the 'Bundles' resource on the TARGET account? Or Source? 
        // Docs: "create a copy of a bundle."
        // Usually: `client.numbers.v2.regulatoryCompliance.bundles.create({ fromBundleSid: ... })`?
        // Let's check if 'create' supports 'fromBundleSid'.
        // Wait, usually it's `bundles(sid).copies.create()`? No...
        // Twilio documentation says: "POST /v2/RegulatoryCompliance/Bundles" with "CopyBundleSid".

        // Let's try creating a bundle in Target using `copyBundleSid`

        // We need to act AS the Target Account to create the bundle THERE.
        // But we are referencing a bundle from the Source Account.
        // Twilio might require the Source Bundle to be globally accessible or we have permission.
        // Since we are Master, we should have permission.

        // NOTE: Does the Source bundle belong to Source or Master? 
        // If it belongs to Source, can Target see it? 
        // We will authenticate as Target (using Master Creds + accountSid param is safest way usually, 
        // BUT for 'copyBundleSid' across accounts, sometimes it's tricky. 
        // Let's try submitting the request to Target Account with CopyBundleSid = sourceBundle.sid)

        // 2. Copy the Bundle
        // The correct API for copying is `bundles(sid).copies.create()`
        // BUT we need to target the *destination* account.
        // If we run `sourceClient.bundles(sid).copies.create({ friendlyName: ... })`, it clones it into Source?
        // Let's check if `accountSid` param allows specifying destination.
        // Documentation says: "Copies the bundle to a new bundle... in the same account."
        // Wait, cross-account copying?
        // "To copy a bundle to a subaccount... you must make the request using the subaccount's credentials... NOT supported?"

        // Actually, there's a trick: `client.numbers.v2.regulatoryCompliance.bundles.create({ copyBundleSid: 'BU...' })`
        // Validation failed previously with "invalid regulation parameters" likely because we didn't provide enough info OR `copyBundleSid` wasn't passed efficiently.

        // Let's retry `create` on TARGET client, passing `copyBundleSid` explicitly.

        console.log('Retrying Copy via Create on Target...');

        // We must cast options to any to pass non-typed properties if TS, but this is JS.
        const copyOptions = {
            friendlyName: 'Porting Copy of BU1793...',
            email: 'giles@awe2m8.com',
            copyBundleSid: bundleToUse, // This is the Key
        };

        // If this fails, we might need to supply isoCountry/numberType to MATCH original?
        // Let's assume we need them.
        // Fetch original bundle details first.
        const original = await sourceClient.numbers.v2.regulatoryCompliance.bundles(bundleToUse).fetch();
        // copyOptions.isoCountry = 'AU'; // We know it's AU
        // copyOptions.numberType = 'mobile';

        // Wait, `create` needs regulation info IF we are creating new. 
        // If copying, maybe we DON'T provide regulation info?
        // Error 22202 "invalid regulation parameters" suggests we provided wrong or missing params.

        // Let's try passing ONLY copyBundleSid and friendlyName.

        let targetBundleSid;
        const copiedBundle = await targetClient.numbers.v2.regulatoryCompliance.bundles.create(copyOptions);
        console.log(`✅ Bundle Copied! New SID: ${copiedBundle.sid}`);
        console.log(`Status: ${copiedBundle.status}`);

        targetBundleSid = copiedBundle.sid;

        // 3. Submit the Copied Bundle
        if (copiedBundle.status === 'draft') {
            console.log('Submitting copied bundle...');
            const submitted = await targetClient.numbers.v2.regulatoryCompliance.bundles(targetBundleSid)
                .update({ status: 'pending-review' });
            console.log(`Submitted Status: ${submitted.status}`);

            if (submitted.status === 'twilio-approved') {
                console.log('✅ Auto-Approved!');

                // 4. PORT NUMBER
                console.log('ATTEMPTING PORT...');
                const portResult = await masterClient.api.v2010.accounts(SOURCE_SID)
                    .incomingPhoneNumbers(phone.sid)
                    .update({
                        accountSid: TARGET_SID,
                        bundleSid: targetBundleSid,
                        // addressSid? If bundle has address proof, maybe we reuse the address from target?
                        // We need an Address Resource in Target.
                        // Let's fetch the Address SID we created earlier.
                    });
                console.log('🎉 Port Successful:', portResult.sid);
            }
        }

        // Let's assume we need to use a raw request if the helper is obscure.
        // But if I can just find the bundle first, that's step 1.

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
