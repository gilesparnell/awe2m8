const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

// Load env vars
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const lines = envConfig.split('\n');
    lines.forEach(line => {
        if (line.trim().startsWith('#')) return;
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            let value = match[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }
            process.env[match[1].trim()] = value;
        }
    });
}

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

if (!ACCOUNT_SID || !AUTH_TOKEN) {
    console.error('Missing credentials');
    process.exit(1);
}

const SOURCE_SUBACCOUNT_SID = process.env.SOURCE_ACCOUNT_SID;
const TARGET_SUBACCOUNT_SID = process.env.TARGET_ACCOUNT_SID;
const NUMBER_TO_MOVE = '+61468170318';

// Initialize Main Client
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// Initialize Target Subaccount Client
const targetClient = twilio(ACCOUNT_SID, AUTH_TOKEN, { accountSid: TARGET_SUBACCOUNT_SID });

async function run() {
    console.log(`--- Starting 21631 (Address) Fix ---`);

    try {
        // 1. Create Address in Target Account
        console.log(`Creating Address in Target Account: ${TARGET_SUBACCOUNT_SID}...`);

        const address = await targetClient.addresses.create({
            customerName: 'AWE2M8 Pty Ltd',
            street: '50a Habitat Way',
            city: 'Lennox Head',
            region: 'NSW',
            postalCode: '2478',
            isoCountry: 'AU',
            friendlyName: 'Porting Address for AWE2M8'
        });

        console.log(`✅ Address Created! SID: ${address.sid}`);

        // 2. Find the number again
        console.log(`Finding number ${NUMBER_TO_MOVE}...`);
        const numbers = await client.api.v2010.accounts(SOURCE_SUBACCOUNT_SID)
            .incomingPhoneNumbers.list({ phoneNumber: NUMBER_TO_MOVE });

        if (numbers.length === 0) throw new Error('Number not found');
        const phoneSid = numbers[0].sid;

        // 3. Attempt Move WITH AddressSid
        console.log(`Attempting transfer WITH AddressSid: ${address.sid}...`);

        try {
            const result = await client.api.v2010.accounts(SOURCE_SUBACCOUNT_SID)
                .incomingPhoneNumbers(phoneSid)
                .update({
                    accountSid: TARGET_SUBACCOUNT_SID,
                    addressSid: address.sid
                });

            console.log('🎉 SUCCESS! Number moved successfully.');
            console.log('New Account SID:', result.accountSid);

        } catch (moveError) {
            console.error('❌ Transfer Failed even with Address.');
            console.error('Code:', moveError.code);
            console.error('Message:', moveError.message);

            if (moveError.code === 21649) {
                console.log('\n--- DIAGNOSIS: Regulatory Bundle Required ---');
                console.log('We have solved the Address issue, but now we need a Regulatory Bundle.');
                console.log('This confirms progress.');
            }
        }

    } catch (err) {
        console.error('Script Error:', err);
    }
}

run();
