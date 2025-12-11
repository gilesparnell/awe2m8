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

const BUNDLE_SID = 'BUd6e3fd542333bf2f64e400763b597603';
// The address linked in the bundle (AD35...) allegedly doesn't exist in the Target Account anymore!
// But the Bundle exists.
// We need to UPDATE the Bundle to use a Valid Address?
// OR use a Valid Address that matches the Bundle's requirements?

// Actually, error 21651 "Address not contained in bundle" means we provided an address NOT in the bundle.
// Error 21613 "Could not find Address... for account... to satisfy requirement" means the address referenced ISN'T in the account.

// So: The Bundle `BUd6...` references Address `AD35...`.
// But Address `AD35...` has likely been DELETED from the account or is inaccessible.
// THIS IS A "TOMBSTONE" BUNDLE ISSUE. The bundle is approved but its dependencies are broken.

// SOLUTION:
// We must created a NEW copy of the bundle with a Valid Address.
// We tried copying/creating before.
// BUT since we have an Approved Bundle, maybe we can FIX it?
// Cannot update approved bundles.

// OK, wait. Can we "Create" the missing address with that SID? No.
// We need to create a NEW Bundle using the OLD Document Images? 
// No, the Document itself references the Address SID in its attributes.
// The Document `AWE2M8 Pty Ltd - Proof of Address` has `address_sids: ['AD35...']`.
// That Document is broken because it points to a non-existent Address.

// HOWEVER: User says "All i am looking for is to port a number...".
// And claimed the bundle is valid. It is "Approved" status, but functionally broken for assignment.

// ULTRA-FIX:
// 1. Create a NEW Address in Target (We have `AD4a...` which is valid).
// 2. Identify the Documents in the broken bundle.
// 3. Create NEW Documents in Target, re-using the File? (We can't download files easily via API).
//    Wait! We have the source local PDF files! (`AWE2M8 Business Address.pdf`)
// 4. Create a NEW BUNDLE (again) with the Valid Address and Fresh Documents.
//    (We did this in `create_bundle_robust.js` and it went to In-Review).
//    (We did this in `smart_clone_bundle.js` and it failed validation).

// CHECK: `AD35...` - Can we restore it? No.
// CHECK: Does `AD35...` exist in Parent? Maybe the bundle was created in Parent?
// If Bundle is in Target but references Parent Address? No, Address must be in same account.

// Let's check where `AD35...` exists.
async function run() {
    console.log('--- Address Hunt ---');
    const masterClient = twilio(ACCOUNT_SID, AUTH_TOKEN);
    const AD_SID = 'AD354867fce4434369e12588c8cd62c07a';

    // Check Target
    try {
        await masterClient.api.v2010.accounts(TARGET_SID).addresses(AD_SID).fetch();
        console.log('Found in Target (Surprising!)');
    } catch (e) { console.log('Not in Target'); }

    // Check Source
    try {
        await masterClient.api.v2010.accounts(SOURCE_SID).addresses(AD_SID).fetch();
        console.log('Found in Source');
    } catch (e) { console.log('Not in Source'); }

    // Check Master
    try {
        await masterClient.api.v2010.addresses(AD_SID).fetch();
        console.log('Found in Master');
    } catch (e) { console.log('Not in Master'); }

    // If it's not in Target, the Bundle `BUd6...` is permanently broken for assignment triggering address requirements.
    // The ONLY path is a NEW Bundle.

    // BUT! Maybe we can update the Phone Number with JUST the Bundle, and NO Address?
    // Tried that? 21631 "AddressSid parameter was empty".

    // CAN WE ASSIGN A *DIFFERENT* ADDRESS (e.g. AD4a...) ALONG WITH THE BUNDLE?
    // We tried that in `simple_port.js`.
    // Error: 21651 "Address [AD4a...] not contained in bundle".
    // This implies the Address passed in API MUST match the one in the Bundle.

    // CONCLUSION: 
    // The User's "Already Approved Bundle" [BUd6...] is technically approved but unusable because it links to a deleted address [AD35...].
    // The User is incorrectly assuming it works.

    // ACTION:
    // I must confidently explain this to the user and switch to the "Wait for Approval" strategy of the NEW bundle `BUf18...` which I created and is valid (but pending).
    // OR create a new bundle that auto-approves? (Hard for AU Business).

    // Let's verify the "Deleted Address" hypothesis first.
}

run();
