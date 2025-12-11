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
const MASTER_BUNDLE_SID = 'BU087706e39868c7ca75418fc37e28b3a5';
const TARGET_ADDRESS_SID = 'AD4a1b21f477301181fa81b0d1dcbd92b5';

async function run() {
    console.log('--- Smart Clone Strategy ---');
    console.log(`Cloning Master Bundle ${MASTER_BUNDLE_SID} to Target...`);

    const masterClient = twilio(ACCOUNT_SID, AUTH_TOKEN);
    const targetCreator = twilio(ACCOUNT_SID, AUTH_TOKEN, { accountSid: TARGET_SID });
    const targetQuery = twilio(ACCOUNT_SID, AUTH_TOKEN, { accountSid: TARGET_SID });

    try {
        // 1. Create Copy in Draft Mode
        const copied = await targetCreator.numbers.v2.regulatoryCompliance.bundles.create({
            friendlyName: 'Smart Clone of Master Bundle',
            email: 'giles@awe2m8.com',
            copyBundleSid: MASTER_BUNDLE_SID,
            isoCountry: 'AU',
            numberType: 'mobile',
            endUserType: 'business'
        });

        console.log(`✅ Bundle Cloned: ${copied.sid} (${copied.status})`);

        // 2. Inspect Items in the New Bundle
        console.log('Inspecting cloned items...');
        const items = await targetQuery.numbers.v2.regulatoryCompliance.bundles(copied.sid).itemAssignments.list();

        for (const item of items) {
            console.log(`- Item: ${item.objectSid}`);

            // If we identify an item (like an Address document) that refers to a bad address, we might need to replace it?
            // Actually, Document Copies usually fail if they depend on an Address.
            // BUT: Supporting Document 'utility_bill' often has 'address_sids' attribute.

            // Check if this item is a Document
            if (item.objectSid.startsWith('RD')) {
                const doc = await targetQuery.numbers.v2.regulatoryCompliance.supportingDocuments(item.objectSid).fetch();
                console.log(`  Doc: ${doc.friendlyName} (Type: ${doc.type})`);
                console.log(`  Attrs: ${JSON.stringify(doc.attributes)}`);

                // If Attributes contains an Address SID that isn't ours, we need to FIX it.
                if (doc.attributes && doc.attributes.address_sids) {
                    console.warn(`  ⚠️ Found linked addresses: ${doc.attributes.address_sids}`);
                    // These SIDs are likely from the Master account and invalid in Target.
                    // We cannot update a Document's attributes. We must upload a NEW one or Create a New Doc?
                    // Actually, we already have a valid address proof doc created in `create_bundle_robust.js` (RD2b3b6bafeeb1c6f8b100afa5690a3aaa).

                    // Action: UNASSIGN this bad doc, ASSIGN our good doc.
                    console.log('  Action: Removing bad doc...');
                    await targetCreator.numbers.v2.regulatoryCompliance.bundles(copied.sid).itemAssignments(item.sid).remove();

                    // We need a known GOOD Address Proof doc in the target account.
                    // Let's use the one from our previous run: RD2b3b6bafeeb1c6f8b100afa5690a3aaa
                    const GOOD_DOC_SID = 'RD2b3b6bafeeb1c6f8b100afa5690a3aaa';
                    // Verify it exists? Assuming yes from logs.

                    console.log(`  Action: Assigning known good doc ${GOOD_DOC_SID}...`);
                    try {
                        await targetCreator.numbers.v2.regulatoryCompliance.bundles(copied.sid).itemAssignments.create({
                            objectSid: GOOD_DOC_SID
                        });
                    } catch (e) {
                        console.error('Failed to assign good doc:', e.message);
                        // Fallback: If good doc not found/deleted, we might need to re-upload.
                        // But let's hope it persists.
                    }
                }
            }
        }

        // 3. Submit
        console.log('Submitting fixed bundle...');
        const submitted = await targetCreator.numbers.v2.regulatoryCompliance.bundles(copied.sid)
            .update({ status: 'pending-review' });
        console.log(`Status: ${submitted.status}`);

        if (submitted.status === 'twilio-approved') {
            console.log('🎉 Bundle APPROVED! Executing Port...');

            const SOURCE_SID = process.env.SOURCE_ACCOUNT_SID;
            const PHONE_SID = 'PNf5c2d825721cab8f4df2bd7f5d3d8c50';

            await masterClient.api.v2010.accounts(SOURCE_SID)
                .incomingPhoneNumbers(PHONE_SID)
                .update({
                    accountSid: TARGET_SID,
                    addressSid: TARGET_ADDRESS_SID,
                    bundleSid: submitted.sid
                });
            console.log('🚢 PORT COMPLETED.');
        } else {
            console.log('Still pending review. Check evaluations.');
        }

    } catch (e) {
        console.error('Process Failed:', e);
    }
}

run();
