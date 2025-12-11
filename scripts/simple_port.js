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

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID; // Parent AC66...
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// Configuration provided by User
const PHONE_NUMBER_SID = 'PNf5c2d825721cab8f4df2bd7f5d3d8c50'; // +61 468 170 318
const SOURCE_SUBACCOUNT_SID = process.env.SOURCE_ACCOUNT_SID;
const GAINING_SUBACCOUNT_SID = process.env.TARGET_ACCOUNT_SID;

// Bundle existing in Target Account (Provided by User)
const BUNDLE_SID = 'BUd6e3fd542333bf2f64e400763b597603';

// Address existing in Target Account (Created previously)
// Required for AU numbers to be configured
const ADDRESS_SID = 'AD4a1b21f477301181fa81b0d1dcbd92b5';

async function run() {
    console.log('--- Simple Port Execution ---');
    console.log(`Moving ${PHONE_NUMBER_SID}`);
    console.log(`From: ${SOURCE_SUBACCOUNT_SID}`);
    console.log(`To:   ${GAINING_SUBACCOUNT_SID}`);
    console.log(`Using Target Bundle:  ${BUNDLE_SID}`);
    console.log(`Using Target Address: ${ADDRESS_SID}`);

    const updatePayload = {
        accountSid: GAINING_SUBACCOUNT_SID,
        bundleSid: BUNDLE_SID,
        addressSid: ADDRESS_SID
    };

    try {
        // Note: The client is initialized with Parent Credentials.
        // We reference the phone number via the SOURCE account (where it currently lives)
        // OR via the Parent's global look up? 
        // The API endpoint is: /2010-04-01/Accounts/{LosingAccountSid}/IncomingPhoneNumbers/{PhoneNumberSid}.json
        // So we use: client.api.v2010.accounts(SOURCE_SID).incomingPhoneNumbers(PN_SID).update(...)

        const number = await client.api.v2010
            .accounts(SOURCE_SUBACCOUNT_SID)
            .incomingPhoneNumbers(PHONE_NUMBER_SID)
            .update(updatePayload);

        console.log(`✅ SUCCESS! Number ${number.phoneNumber} moved to ${number.accountSid}`);

    } catch (error) {
        console.error('❌ Error moving number:', error.code, error.message);

        if (error.code === 21649) {
            console.log('Hint: Double check that Bundle BUd6... is actually APPROVED and exists in the TARGET account.');
        }
        if (error.code === 21631) {
            console.log('Hint: Double check Address AD4a... exists in the TARGET account.');
        }
    }
}

run();
