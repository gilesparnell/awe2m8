const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

// Load env vars manually
const envPath = path.resolve(__dirname, '../.env.local');
console.log('Loading env from:', envPath);

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const lines = envConfig.split('\n');
    lines.forEach(line => {
        // Skip comments
        if (line.trim().startsWith('#')) return;

        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // Remove wrapping quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }
            process.env[key] = value;
        }
    });
} else {
    console.error('.env.local file not found');
}

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

console.log('ACCOUNT_SID present:', !!ACCOUNT_SID);
console.log('AUTH_TOKEN present:', !!AUTH_TOKEN);

if (!ACCOUNT_SID || !AUTH_TOKEN) {
    console.error('Missing credentials. Please check .env.local');
    process.exit(1);
}

const SOURCE_SUBACCOUNT_SID = process.env.SOURCE_ACCOUNT_SID;
const TARGET_SUBACCOUNT_SID = process.env.TARGET_ACCOUNT_SID;
const NUMBER_TO_MOVE = '+61468170318';

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

async function run() {
    console.log(`Authenticating as Master Account: ${ACCOUNT_SID}`);

    try {
        // 1. Find the number in the source account
        console.log(`Looking for ${NUMBER_TO_MOVE} in source account ${SOURCE_SUBACCOUNT_SID}...`);
        const numbers = await client.api.v2010.accounts(SOURCE_SUBACCOUNT_SID)
            .incomingPhoneNumbers.list({ phoneNumber: NUMBER_TO_MOVE });

        if (numbers.length === 0) {
            console.error('Number not found in source account!');
            return;
        }

        const phoneSid = numbers[0].sid;
        console.log(`Found Number SID: ${phoneSid}`);
        console.log(`Current Friendly Name: ${numbers[0].friendlyName}`);

        // 2. Attempt to move
        console.log(`Attempting to move ${phoneSid} to ${TARGET_SUBACCOUNT_SID}...`);

        try {
            const result = await client.api.v2010.accounts(SOURCE_SUBACCOUNT_SID)
                .incomingPhoneNumbers(phoneSid)
                .update({ accountSid: TARGET_SUBACCOUNT_SID });

            console.log('SUCCESS! Number moved.');
            console.log('New Account SID:', result.accountSid);
        } catch (moveError) {
            console.error('FAILED to move number.');
            console.error('Error Code:', moveError.code);
            console.error('Error Message:', moveError.message);

            if (moveError.moreInfo) console.error('More Info:', moveError.moreInfo);

            // Check for 21631 (Address) or 21649 (Bundle)
            if (moveError.code === 21631) {
                console.log('--- DIAGNOSIS: Address Required ---');
            }
            if (moveError.code === 21649) {
                console.log('--- DIAGNOSIS: Regulatory Bundle Required ---');
            }
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

run();
