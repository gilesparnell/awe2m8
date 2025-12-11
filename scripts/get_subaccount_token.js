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

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TARGET_SUBACCOUNT_SID = process.env.TARGET_ACCOUNT_SID;

async function run() {
    console.log(`Fetching details for ${TARGET_SUBACCOUNT_SID}...`);
    try {
        const account = await client.api.v2010.accounts(TARGET_SUBACCOUNT_SID).fetch();
        console.log('Account Status:', account.status);
        console.log('Friendly Name:', account.friendlyName);
        console.log('Auth Token:', account.authToken ? 'FOUND!' + account.authToken.substring(0, 5) + '...' : 'NOT FOUND');
    } catch (e) {
        console.error(e);
    }
}

run();
