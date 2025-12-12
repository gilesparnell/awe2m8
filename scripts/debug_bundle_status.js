const twilio = require('twilio');
const path = require('path');
const fs = require('fs');

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
const TARGET_SUBACCOUNT = process.env.TARGET_ACCOUNT_SID;

console.log("Account: " + ACCOUNT_SID);
console.log("Target: " + TARGET_SUBACCOUNT);

const client = twilio(ACCOUNT_SID, AUTH_TOKEN, { accountSid: TARGET_SUBACCOUNT });

async function run() {
    console.log("Fetching bundles for:", TARGET_SUBACCOUNT);
    try {
        const bundles = await client.numbers.v2.regulatoryCompliance.bundles.list({ limit: 20 });

        console.log("\n--- RAW STATUS DUMP ---");
        bundles.forEach(b => {
            // Trim whitespace to be absolutely sure of what the API returns
            console.log(`SID: ${b.sid} | Status: '${b.status}' | FriendlyName: ${b.friendlyName}`);
        });
    } catch (e) {
        console.error("Error", e);
    }
}

run();
