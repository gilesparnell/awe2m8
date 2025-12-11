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
const SOURCE_BUNDLE_SID = 'BU179346531a0a5ed53e93f1c0ee077dd7';

async function run() {
    console.log(`Inspecting Source Bundle ${SOURCE_BUNDLE_SID}...`);
    const sourceClient = twilio(ACCOUNT_SID, AUTH_TOKEN, { accountSid: SOURCE_SID });

    try {
        const items = await sourceClient.numbers.v2.regulatoryCompliance.bundles(SOURCE_BUNDLE_SID).itemAssignments.list();

        for (const item of items) {
            console.log(`\nItem SID: ${item.objectSid}`);

            if (item.objectSid.startsWith('IT')) {
                console.log('Type: End User');
                const endUser = await sourceClient.numbers.v2.regulatoryCompliance.endUsers(item.objectSid).fetch();
                console.log('Friendly Name:', endUser.friendlyName);
                console.log('Type:', endUser.type);
                console.log('Attributes:', JSON.stringify(endUser.attributes, null, 2));
            } else if (item.objectSid.startsWith('RD')) {
                console.log('Type: Document');
                const doc = await sourceClient.numbers.v2.regulatoryCompliance.supportingDocuments(item.objectSid).fetch();
                console.log('Friendly Name:', doc.friendlyName);
                console.log('Type:', doc.type);
                console.log('Attributes:', JSON.stringify(doc.attributes, null, 2));
            }
        }

    } catch (e) {
        console.error(e);
    }
}

run();
