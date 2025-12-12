const twilio = require('twilio');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Manual .env.local loader
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2 && !line.startsWith('#')) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
            process.env[key] = value;
        }
    });
    console.log("Loaded .env.local");
} else {
    console.log(".env.local not found, relying on existing env vars.");
}

// Load env vars if possible, or expect them to be set
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
    console.error("Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN env vars.");
    process.exit(1);
}

const client = twilio(accountSid, authToken);

async function runTest() {
    console.log("--- STARTING BUNDLE CREATION SIMULATION ---");

    try {
        // 1. Create a Test SubAccount
        console.log("1. Creating temporary Test SubAccount...");
        const subAccount = await client.api.v2010.accounts.create({
            friendlyName: 'AntiGravity Bundle Validation Test'
        });
        console.log(`   ✅ Created SubAccount: ${subAccount.sid}`);

        const subSid = subAccount.sid;
        const subAuthToken = subAccount.authToken;
        const subClient = twilio(subSid, subAuthToken);
        const subAuth = Buffer.from(`${subSid}:${subAuthToken}`).toString('base64');

        // Test Data (Matching route.ts defaults)
        const businessInfo = {
            businessName: 'AWE2M8 Pty Ltd',
            street: '50a Habitat Way',
            city: 'Lennox Head',
            state: 'NSW',
            postalCode: '2478',
            country: 'AU',
            ein: '123456789', // Fake ABN for testing? Or should we use a real-ish one? 
            // Twilio validates format usually. 
            // ABN is 11 digits. 
            // Let's use a placeholder that looks valid-ish if possible or rely on the user providing one.
            // route.ts uses businessInfo.ein
            businessType: 'corporation',
            businessIndustry: 'TECHNOLOGY',
            email: 'test@awe2m8.com'
        };

        // 2. Create Address
        console.log("2. Creating Regulatory Address...");
        const address = await subClient.addresses.create({
            customerName: businessInfo.businessName,
            street: businessInfo.street,
            city: businessInfo.city,
            region: businessInfo.state,
            postalCode: businessInfo.postalCode,
            isoCountry: businessInfo.country,
            emergencyEnabled: false,
            friendlyName: 'Validation Test Address'
        });
        console.log(`   ✅ Address Created: ${address.sid}`);

        // 3. Upload Helper
        const uploadDocument = (docType, filename, attributes) => new Promise((resolve, reject) => {
            console.log(`   Uploading ${filename} as ${docType}...`);
            // Adjust path for script location (root is one up)
            const filePath = path.join(__dirname, '../public/admin/documents', filename);

            if (!fs.existsSync(filePath)) {
                reject(new Error(`File not found: ${filePath}`));
                return;
            }

            const boundary = 'TwilioBoundary' + Math.random().toString(16);
            const content = fs.readFileSync(filePath);

            const parts = [
                `--${boundary}`, `Content-Disposition: form-data; name="FriendlyName"`, '', `${filename} (Test Upload)`,
                `--${boundary}`, `Content-Disposition: form-data; name="Type"`, '', docType,
                `--${boundary}`, `Content-Disposition: form-data; name="Attributes"`, '', JSON.stringify(attributes),
                `--${boundary}`, `Content-Disposition: form-data; name="File"; filename="${filename}"`, `Content-Type: application/pdf`, '', ''
            ];

            const payload = Buffer.concat([
                Buffer.from(parts.join('\r\n')),
                content,
                Buffer.from(`\r\n--${boundary}--`)
            ]);

            const req = https.request({
                hostname: 'numbers.twilio.com',
                path: '/v2/RegulatoryCompliance/SupportingDocuments',
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${subAuth}`,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': payload.length
                }
            }, (res) => {
                let data = '';
                res.on('data', (c) => data += c);
                res.on('end', () => {
                    if (res.statusCode < 300) {
                        const json = JSON.parse(data);
                        resolve(json.sid);
                    } else {
                        reject(new Error(`Twilio Upload Error: ${data}`));
                    }
                });
            });

            req.on('error', (e) => reject(e));
            req.write(payload);
            req.end();
        });

        // 4. Upload Documents
        console.log("3. Uploading Supporting Documents...");
        const regAttrs = {
            business_name: businessInfo.businessName,
            document_number: businessInfo.ein || '53004085616' // Use a valid-looking ABN if possible for test
        };
        const addrAttrs = {
            address_sids: [address.sid] // Link address doc to the created address
        };

        const regDocSid = await uploadDocument('commercial_registrar_excerpt', 'AWE2M8 Company Registration.pdf', regAttrs);
        console.log(`   ✅ Reg Doc Uploaded: ${regDocSid}`);

        const addrDocSid = await uploadDocument('utility_bill', 'AWE2M8 Business Address.pdf', addrAttrs);
        console.log(`   ✅ Address Doc Uploaded: ${addrDocSid}`);

        // 5. Create End User
        console.log("4. Creating End User...");
        const endUserAttrs = {
            business_name: businessInfo.businessName,
            business_type: businessInfo.businessType,
            business_registration_identifier: regAttrs.document_number,
            business_identity: 'direct_customer',
            business_industry: businessInfo.businessIndustry,
        };
        const endUser = await subClient.numbers.v2.regulatoryCompliance.endUsers.create({
            friendlyName: businessInfo.businessName,
            type: 'business',
            attributes: JSON.stringify(endUserAttrs)
        });
        console.log(`   ✅ End User Created: ${endUser.sid}`);

        // 6. Create Bundle
        console.log("5. Creating Bundle...");
        const bundle = await subClient.numbers.v2.regulatoryCompliance.bundles.create({
            friendlyName: `${businessInfo.businessName} - Validation Bundle`,
            email: businessInfo.email,
            endUserType: 'business',
            isoCountry: 'AU',
            numberType: 'mobile'
        });
        console.log(`   ✅ Bundle Created: ${bundle.sid} (Status: ${bundle.status})`);

        // 7. Assign Items
        console.log("6. Assigning Items to Bundle...");
        await subClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: endUser.sid });
        console.log(`   - Assigned EndUser`);
        await subClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: regDocSid });
        console.log(`   - Assigned Reg Doc`);
        await subClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).itemAssignments.create({ objectSid: addrDocSid });
        console.log(`   - Assigned Address Doc`);

        // 8. Submit Bundle
        console.log("7. Submitting Bundle for Review...");
        const submitted = await subClient.numbers.v2.regulatoryCompliance.bundles(bundle.sid).update({
            status: 'pending-review'
        });
        console.log(`   ✅ Bundle Submitted! New Status: ${submitted.status}`);

        console.log("\n--- TEST SUMMARY ---");
        console.log(`SubAccount: ${subSid}`);
        console.log(`Bundle SID: ${bundle.sid}`);
        console.log(`Final Status: ${submitted.status}`);

        if (submitted.status === 'pending-review') {
            console.log("\nSUCCESS: The bundle creation logic is valid and results in a Pending Review state.");
        } else {
            console.error("\nFAILURE: Bundle did not reach 'pending-review' state.");
        }

        // Cleanup? 
        console.log("\nNote: This test created a real subaccount. You may want to close it manually or via script if desired.");
        // await client.api.v2010.accounts(subSid).update({ status: 'closed' });

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error);
    }
}

runTest();
