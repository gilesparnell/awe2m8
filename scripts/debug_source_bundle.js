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
    console.log('--- Deep Debug Source Bundle ---');
    const sourceClient = twilio(ACCOUNT_SID, AUTH_TOKEN, { accountSid: SOURCE_SID });
    const PHONE_NUMBER = '+61468170318';

    try {
        // 1. Get Phone Number
        const numbers = await sourceClient.incomingPhoneNumbers.list({ phoneNumber: PHONE_NUMBER, limit: 1 });
        if (numbers.length === 0) throw new Error('Number not found');
        const phone = numbers[0];
        console.log(`Phone SID: ${phone.sid}`);
        console.log(`Bundle SID on Phone: ${phone.bundleSid}`);

        const BUNDLE_SID = phone.bundleSid;
        if (!BUNDLE_SID) throw new Error('No Bundle SID on phone');

        // 2. Fetch Bundle Details
        try {
            const bundle = await sourceClient.numbers.v2.regulatoryCompliance.bundles(BUNDLE_SID).fetch();
            console.log(`Bundle Found: ${bundle.sid} (${bundle.status})`);
        } catch (e) {
            console.error(`Bundle Fetch Failed: ${e.code} ${e.message}`);
            // If this fails, we can't do anything with this bundle.
            return;
        }

        // 3. List Item Assignments
        console.log('Listing Items...');
        try {
            const items = await sourceClient.numbers.v2.regulatoryCompliance.bundles(BUNDLE_SID).itemAssignments.list();
            console.log(`Found ${items.length} items`);

            for (const item of items) {
                console.log(`- ${item.objectSid}`);

                // If it's an EndUser, let's see if we can "Move" it
                if (item.objectSid.startsWith('IT')) {
                    const eu = await sourceClient.numbers.v2.regulatoryCompliance.endUsers(item.objectSid).fetch();
                    console.log(`  EndUser: ${eu.friendlyName}, Status: ${eu.status || 'unknown'}`);
                    console.log(`  Attributes: ${JSON.stringify(eu.attributes)}`);

                    // CAN WE CREATE A COPY IN TARGET?
                    // "To copy a Bundle..." -> We already tried copying the bundle and it failed (404/Invalid).
                    // Maybe we construct a NEW bundle in Target using EXACT attributes?
                }
            }
        } catch (e) {
            console.error(`Item List Failed: ${e.code} ${e.message}`);
        }

    } catch (e) {
        console.error(e);
    }
}

run();
