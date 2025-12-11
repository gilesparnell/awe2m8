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
const SOURCE_BUNDLE_SID = 'BU179346531a0a5ed53e93f1c0ee077dd7';

async function run() {
    console.log(`Checking Master Account for ${SOURCE_BUNDLE_SID}...`);
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

    try {
        const bundle = await client.numbers.v2.regulatoryCompliance.bundles(SOURCE_BUNDLE_SID).fetch();
        console.log('Found in Master!');
        console.log('Status:', bundle.status);
        console.log('Email:', bundle.email);

        // List items
        const items = await client.numbers.v2.regulatoryCompliance.bundles(SOURCE_BUNDLE_SID).itemAssignments.list();
        for (const item of items) {
            console.log(`\nItem SID: ${item.objectSid}`);
            if (item.objectSid.startsWith('IT')) {
                const endUser = await client.numbers.v2.regulatoryCompliance.endUsers(item.objectSid).fetch();
                console.log('EndUser Attributes:', JSON.stringify(endUser.attributes, null, 2));
            } else if (item.objectSid.startsWith('RD')) {
                const doc = await client.numbers.v2.regulatoryCompliance.supportingDocuments(item.objectSid).fetch();
                console.log('Doc Type:', doc.type);
                console.log('Doc Attributes:', JSON.stringify(doc.attributes, null, 2));
            }
        }
    } catch (e) {
        console.log('Not in Master:', e.status);
    }
}

run();
