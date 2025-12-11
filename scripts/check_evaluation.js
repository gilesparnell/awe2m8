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

async function run() {
    console.log('Fetching Evaluation Results...');

    // Get Subaccount Token first
    const masterClient = twilio(ACCOUNT_SID, AUTH_TOKEN);
    const subAccount = await masterClient.api.v2010.accounts(TARGET_SUBACCOUNT_SID).fetch();
    const subClient = twilio(TARGET_SUBACCOUNT_SID, subAccount.authToken);

    const BUNDLE_SID = 'BUcb7621692770c811524ebb8ff7bbd7e8';
    // const EVAL_SID = 'EL...'; 

    console.log(`Checking evaluations for ${BUNDLE_SID}...`);
    const evaluations = await subClient.numbers.v2.regulatoryCompliance.bundles(BUNDLE_SID).evaluations.list();
    if (evaluations.length === 0) {
        console.log('No evaluations yet (Good sign or too early).');
        return;
    }
    const EVAL_SID = evaluations[0].sid;
    console.log(`Latest Evaluation: ${EVAL_SID}`);

    try {
        const evaluation = await subClient.numbers.v2.regulatoryCompliance.bundles(BUNDLE_SID)
            .evaluations(EVAL_SID)
            .fetch();

        console.log('Status:', evaluation.status);
        console.log('Results:');

        // Results is an array of checks?
        console.dir(evaluation.results, { depth: null, colors: true });
    } catch (e) {
        console.error(e);
    }
}

run();
