/**
 * Integration Tests for Twilio Number Porting
 * 
 * These tests run against the ACTUAL deployed API endpoint.
 * They verify the complete flow from API call to Twilio response.
 * 
 * ⚠️ WARNING: These tests modify real Twilio resources!
 * They should only run in CI/CD with test accounts.
 * 
 * Set INTEGRATION_TEST=true to enable these tests
 * Set TEST_PHONE_NUMBER to specify the number to test with
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://internal.awe2m8.ai';
const TEST_PHONE_NUMBER = process.env.TEST_PHONE_NUMBER || '+61468170318';

// Test account SIDs from environment variables
// Set these in your CI/CD environment or .env.test file
const ACCOUNTS = {
    AWE2M8: process.env.TEST_ACCOUNT_AWE2M8 || '',
    TEST: process.env.TEST_ACCOUNT_TEST || '',
    ACCOUNT77: process.env.TEST_ACCOUNT_77 || '',
    FITNESS_BOXX: process.env.TEST_ACCOUNT_FITNESS || '',
};

// Skip tests if not explicitly enabled
const isIntegrationEnabled = process.env.INTEGRATION_TEST === 'true';

describe('Integration: Twilio Porting', () => {
    // Skip all tests if integration testing is not enabled
    beforeAll(() => {
        if (!isIntegrationEnabled) {
            console.log('⚠️ Integration tests skipped. Set INTEGRATION_TEST=true to run.');
        }
    });

    describe('API Health Check', () => {
        it('should respond to port-number endpoint', async () => {
            if (!isIntegrationEnabled) return;

            const response = await fetch(`${API_BASE_URL}/api/twilio/port-number`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'list',
                    sourceAccountSid: ACCOUNTS.AWE2M8,
                }),
            });

            expect(response.status).toBeLessThan(500); // Not a server error
        });
    });

    describe('Number Listing', () => {
        it('should list numbers in an account', async () => {
            if (!isIntegrationEnabled) return;

            const response = await fetch(`${API_BASE_URL}/api/twilio/port-number`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'list',
                    sourceAccountSid: ACCOUNTS.AWE2M8,
                }),
            });

            const data = await response.json();

            expect(data.success).toBe(true);
            expect(Array.isArray(data.numbers)).toBe(true);
        });
    });

    describe('Number Porting Sequence', () => {
        // This test performs an actual port - be careful!
        it('should port number from AWE2M8 to TEST', async () => {
            if (!isIntegrationEnabled) return;

            // First, find where the number currently is
            const findResponse = await fetch(`${API_BASE_URL}/api/twilio/port-number`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'list',
                    sourceAccountSid: ACCOUNTS.AWE2M8,
                }),
            });

            const findData = await findResponse.json();
            const numberInAwe2m8 = findData.numbers?.find(
                (n: any) => n.phoneNumber === TEST_PHONE_NUMBER
            );

            if (!numberInAwe2m8) {
                console.log(`Number ${TEST_PHONE_NUMBER} not in AWE2M8, skipping test`);
                return;
            }

            // Perform the port
            const portResponse = await fetch(`${API_BASE_URL}/api/twilio/port-number`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceAccountSid: ACCOUNTS.AWE2M8,
                    targetAccountSid: ACCOUNTS.TEST,
                    phoneNumber: TEST_PHONE_NUMBER,
                }),
            });

            const portData = await portResponse.json();

            expect(portData.success).toBe(true);
            expect(portData.data.newAccountSid).toBe(ACCOUNTS.TEST);
        }, 60000); // 60s timeout for live API calls

        it('should port number back to AWE2M8', async () => {
            if (!isIntegrationEnabled) return;

            // Find where number is now
            const findResponse = await fetch(`${API_BASE_URL}/api/twilio/port-number`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'list',
                    sourceAccountSid: ACCOUNTS.TEST,
                }),
            });

            const findData = await findResponse.json();
            const numberInTest = findData.numbers?.find(
                (n: any) => n.phoneNumber === TEST_PHONE_NUMBER
            );

            if (!numberInTest) {
                console.log(`Number ${TEST_PHONE_NUMBER} not in TEST, skipping`);
                return;
            }

            // Port back to AWE2M8
            const portResponse = await fetch(`${API_BASE_URL}/api/twilio/port-number`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceAccountSid: ACCOUNTS.TEST,
                    targetAccountSid: ACCOUNTS.AWE2M8,
                    phoneNumber: TEST_PHONE_NUMBER,
                }),
            });

            const portData = await portResponse.json();

            expect(portData.success).toBe(true);
            expect(portData.data.newAccountSid).toBe(ACCOUNTS.AWE2M8);
        }, 60000);
    });
});

describe('Regression: Known Bug Fixes', () => {
    describe('21649 Bundle Required Error', () => {
        it('should NOT throw raw 21649 error for AU numbers', async () => {
            if (!isIntegrationEnabled) return;

            const response = await fetch(`${API_BASE_URL}/api/twilio/port-number`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceAccountSid: ACCOUNTS.AWE2M8,
                    targetAccountSid: ACCOUNTS.TEST,
                    phoneNumber: TEST_PHONE_NUMBER,
                }),
            });

            const data = await response.json();

            // Should either succeed OR give a helpful error (not raw Twilio error)
            if (!data.success) {
                expect(data.error).not.toContain('Bundle required and not provided');
                expect(data.error).toMatch(/bundle|address|regulatory/i);
            }
        });
    });

    describe('21651 Address Not In Bundle Error', () => {
        it('should iterate through addresses to find matching one', async () => {
            if (!isIntegrationEnabled) return;

            // This is tested implicitly by the port sequence succeeding
            // If it fails with 21651, the iteration logic is broken

            const response = await fetch(`${API_BASE_URL}/api/twilio/port-number`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceAccountSid: ACCOUNTS.AWE2M8,
                    targetAccountSid: ACCOUNTS.ACCOUNT77,
                    phoneNumber: TEST_PHONE_NUMBER,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                expect(data.error).not.toContain('Address not in bundle');
            }
        }, 60000);
    });

    describe('Wrong Route Bug', () => {
        it('should use port-number route, not workflow route', async () => {
            if (!isIntegrationEnabled) return;

            // Verify the correct route is being used by checking response format
            const response = await fetch(`${API_BASE_URL}/api/twilio/port-number`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'list',
                    sourceAccountSid: ACCOUNTS.AWE2M8,
                }),
            });

            const data = await response.json();

            // port-number route returns { success, numbers }
            // workflow route returns different format
            expect(data).toHaveProperty('success');
            if (data.success) {
                expect(data).toHaveProperty('numbers');
            }
        });
    });
});
