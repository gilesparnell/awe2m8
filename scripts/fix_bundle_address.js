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

// User provided Bundle
const BUNDLE_SID = 'BUd6e3fd542333bf2f64e400763b597603';
// Previous Address
const ADDRESS_SID = 'AD4a1b21f477301181fa81b0d1dcbd92b5';

async function run() {
    console.log('--- Inspecting Bundle Address Mismatch ---');
    // Auth as Target
    const masterClient = twilio(ACCOUNT_SID, AUTH_TOKEN);
    const subAccount = await masterClient.api.v2010.accounts(TARGET_SID).fetch();
    const targetClient = twilio(TARGET_SID, subAccount.authToken);

    try {
        console.log(`Checking Bundle ${BUNDLE_SID}...`);

        // 1. Check if Bundle really exists and is approved
        const bundle = await targetClient.numbers.v2.regulatoryCompliance.bundles(BUNDLE_SID).fetch();
        console.log(`Status: ${bundle.status}`);

        // 2. Check Items to find the Address Proof
        const items = await targetClient.numbers.v2.regulatoryCompliance.bundles(BUNDLE_SID).itemAssignments.list();
        let validAddressSid = null;

        for (const item of items) {
            if (item.objectSid.startsWith('RD')) {
                const doc = await targetClient.numbers.v2.regulatoryCompliance.supportingDocuments(item.objectSid).fetch();
                console.log(`Doc: ${doc.friendlyName} (${doc.type})`);
                if (doc.attributes && doc.attributes.address_sids) {
                    console.log(`  Linked Addresses: ${doc.attributes.address_sids}`);
                    if (doc.attributes.address_sids.length > 0) {
                        validAddressSid = doc.attributes.address_sids[0];
                    }
                }
            }
        }

        if (validAddressSid) {
            console.log(`\n✅ FOUND VALID ADDRESS SID IN BUNDLE: ${validAddressSid}`);
            console.log(`(Previous attempt used ${ADDRESS_SID})`);

            if (validAddressSid !== ADDRESS_SID) {
                console.log('MISMATCH DETECTED! Retrying Port with CORRECT Address...');

                // RETRY PORT
                const PHONE_SID = 'PNf5c2d825721cab8f4df2bd7f5d3d8c50';
                const result = await masterClient.api.v2010.accounts(SOURCE_SID)
                    .incomingPhoneNumbers(PHONE_SID)
                    .update({
                        accountSid: TARGET_SID,
                        bundleSid: BUNDLE_SID,
                        addressSid: validAddressSid // Use the one actually linked to the bundle
                    });
                console.log(`✅ SUCCESS! Number ported to ${result.accountSid}`);
            }
        } else {
            console.error('❌ Could not find an Address SID inside the Bundle items.');
        }

    } catch (e) {
        console.error(e);
    }
}

run();
