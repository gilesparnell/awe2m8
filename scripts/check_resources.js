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

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TARGET_SUBACCOUNT_SID = process.env.TARGET_ACCOUNT_SID;

const client = twilio(ACCOUNT_SID, AUTH_TOKEN, { accountSid: TARGET_SUBACCOUNT_SID });

async function run() {
    console.log(`Checking documents in ${TARGET_SUBACCOUNT_SID}...`);
    try {
        const docs = await client.numbers.v2.regulatoryCompliance.supportingDocuments.list({ limit: 20 });
        console.log(`Found ${docs.length} documents.`);
        docs.forEach(d => {
            console.log(`- [${d.sid}] ${d.friendlyName} (${d.status})`);
        });

        const bundles = await client.numbers.v2.regulatoryCompliance.bundles.list({ limit: 5 });
        console.log(`Found ${bundles.length} bundles.`);
        bundles.forEach(b => {
            console.log(`- [${b.sid}] ${b.friendlyName} (${b.status})`);
        });

    } catch (e) {
        console.error(e);
    }
}

run();
