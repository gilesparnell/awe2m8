const twilio = require('twilio');

// Load Env
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

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function run() {
    console.log('Listing Regulations for AU Mobile...');

    const regulations = await client.numbers.v2.regulatoryCompliance.regulations.list({
        isoCountry: 'AU',
        numberType: 'mobile',
        limit: 20
    });

    if (regulations.length === 0) {
        console.log('No regulations found.');
        return;
    }

    const reg = regulations.find(r => r.endUserType === 'business') || regulations[0];
    console.log(`Regulation SID: ${reg.sid}`);
    console.log(`Friendly Name: ${reg.friendlyName}`);

    // Requirements usually aren't fully expanded in list, need to fetch?
    // Actually, create bundle usually works with just Country/Type.
    // But we need the document types.

    // There isn't a direct "Get Requirements" API easy to read, 
    // BUT we can look at "EndUserTypes" and "RequirementSets"?
    // Or just look at the error message 'Document type not found' -> it means the string I passed.
    const util = require('util');
    const types = [];
    JSON.stringify(reg.requirements, (key, value) => {
        if (key === 'type' && typeof value === 'string') types.push(value);
        return value;
    });
    console.log('All Found Types:', types);
    console.log(util.inspect(reg.requirements, { showHidden: false, depth: 4, colors: true }));
}

run();
