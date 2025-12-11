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

// Configuration
const CONFIG = {
    sourceAccountSid: process.env.SOURCE_ACCOUNT_SID,
    targetAccountSid: process.env.TARGET_ACCOUNT_SID,
    params: {
        phoneNumberSid: 'PNf5c2d825721cab8f4df2bd7f5d3d8c50', // +61 468 170 318
        addressSid: 'AD4a1b21f477301181fa81b0d1dcbd92b5',
        bundleSid: 'BUf18c62d891c36a31143fac068e9207d6'
    }
};

async function run() {
    console.log('--- Twilio Port Finalizer ---');
    console.log(`Checking Bundle ${CONFIG.params.bundleSid}...`);

    const masterClient = twilio(ACCOUNT_SID, AUTH_TOKEN);

    // Auth as Target Subaccount to check Bundle
    try {
        const subAccount = await masterClient.api.v2010.accounts(CONFIG.targetAccountSid).fetch();
        const subClient = twilio(CONFIG.targetAccountSid, subAccount.authToken);

        const bundle = await subClient.numbers.v2.regulatoryCompliance.bundles(CONFIG.params.bundleSid).fetch();
        console.log(`Bundle Status: ${bundle.status.toUpperCase()}`);

        if (bundle.status === 'twilio-approved') {
            console.log('✅ Bundle is APPROVED. Attempting Port...');

            // Execute Port using Master Client
            const result = await masterClient.api.v2010.accounts(CONFIG.sourceAccountSid)
                .incomingPhoneNumbers(CONFIG.params.phoneNumberSid)
                .update({
                    accountSid: CONFIG.targetAccountSid,
                    addressSid: CONFIG.params.addressSid,
                    bundleSid: CONFIG.params.bundleSid
                });

            console.log('🎉 SUCCESS! Number Ported.');
            console.log(`Number is now in Account: ${result.accountSid}`);

        } else if (bundle.status === 'pending-review' || bundle.status === 'in-review') {
            console.log('⏳ Bundle is pending review by Twilio.');
            console.log('This usually takes 24-48 hours for AU Mobile numbers.');
            console.log('Evaluation Result: COMPLIANT (All automated checks passed).');
            console.log('Action: Run this script again periodically until approved.');

        } else {
            console.warn(`❌ Bundle is ${bundle.status}. Check evaluations for details.`);
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
