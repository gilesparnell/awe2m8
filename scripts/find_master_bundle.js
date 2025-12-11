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
const SOURCE_SID = process.env.SOURCE_ACCOUNT_SID;
const TARGET_SID = process.env.TARGET_ACCOUNT_SID;

async function run() {
    console.log('--- Checking Master Account Bundles ---');
    const masterClient = twilio(ACCOUNT_SID, AUTH_TOKEN);

    try {
        const bundles = await masterClient.numbers.v2.regulatoryCompliance.bundles.list({
            status: 'twilio-approved',
            isoCountry: 'AU',
            limit: 20
        });

        console.log(`Found ${bundles.length} approved AU bundles in Master.`);

        for (const b of bundles) {
            console.log(`[${b.sid}] ${b.friendlyName} (EndUser: ${b.endUserType})`);

            // Try ALL bundles
            console.log(`>>> Attempting Port with Master Bundle ${b.sid}...`);
            try {
                // Update Number in Source to move to Target using Master Bundle
                // Note: targetAccountSid is specified. bundleSid is specified.
                // If Master Bundle is shareable, this might work.

                const PHONE_SID = 'PNf5c2d825721cab8f4df2bd7f5d3d8c50';
                const ADDRESS_SID = 'AD4a1b21f477301181fa81b0d1dcbd92b5'; // We still need an address in Target? 
                // Or maybe we need an address in Master? 
                // Address Resource MUST exist in the Account that OWNS the number (Target).
                // So ADDRESS_SID must be the one we created in Target (AD4a...).

                const result = await masterClient.api.v2010.accounts(SOURCE_SID)
                    .incomingPhoneNumbers(PHONE_SID)
                    .update({
                        accountSid: TARGET_SID,
                        addressSid: ADDRESS_SID,
                        bundleSid: b.sid
                    });

                console.log('🎉 SUCCESS! Ported using Master Bundle.');
                return;
            } catch (e) {
                console.log(`Failed with this bundle: ${e.code} ${e.message}`);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

run();
