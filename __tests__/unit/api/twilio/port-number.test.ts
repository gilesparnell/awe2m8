/**
 * Unit Tests for /api/twilio/port-number
 * 
 * Tests the number porting functionality including:
 * - Simple transfers (no regulatory requirements)
 * - AU number transfers (bundle + address required)
 * - Error handling for missing resources
 * - Nested iteration through bundles and addresses
 */

import {
    resetMockState,
    addMockAccount,
    addMockNumber,
    addMockBundle,
    addMockAddress,
    getMockNumbers,
    getMockAddresses,
    setMockError,
    clearMockError,
    createMockTwilioClient,
} from '../../../mocks/twilio.mock';

// Mock the twilio module before importing the route
jest.mock('twilio', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(createMockTwilioClient),
}));

// Mock Auth
jest.mock('@/lib/auth', () => ({
    auth: jest.fn().mockResolvedValue({ user: { email: 'test@example.com' } })
}));

// Mock NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        json: (data: any, init?: { status?: number }) => ({
            json: async () => data,
            status: init?.status || 200,
            ...data,
        }),
    },
}));

describe('Port Number API', () => {
    beforeEach(() => {
        resetMockState();
        clearMockError();

        // Setup default test accounts
        addMockAccount('AC_SOURCE', 'Source Account');
        addMockAccount('AC_TARGET', 'Target Account');
        addMockAccount('AC_MASTER', 'Master Account');
    });

    describe('Input Validation', () => {
        it('should reject request without credentials', async () => {
            const { POST } = await import('@/app/api/twilio/port-number/route');

            // Temporarily remove env vars
            const originalSid = process.env.TWILIO_ACCOUNT_SID;
            const originalToken = process.env.TWILIO_AUTH_TOKEN;
            delete process.env.TWILIO_ACCOUNT_SID;
            delete process.env.TWILIO_AUTH_TOKEN;

            const request = new Request('http://localhost/api/twilio/port-number', {
                method: 'POST',
                body: JSON.stringify({
                    sourceAccountSid: 'AC_SOURCE',
                    targetAccountSid: 'AC_TARGET',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.success).toBe(false);
            expect(data.error).toContain('credentials');

            // Restore env vars
            process.env.TWILIO_ACCOUNT_SID = originalSid;
            process.env.TWILIO_AUTH_TOKEN = originalToken;
        });

        it('should reject request without sourceAccountSid', async () => {
            const { POST } = await import('@/app/api/twilio/port-number/route');

            const request = new Request('http://localhost/api/twilio/port-number', {
                method: 'POST',
                body: JSON.stringify({
                    targetAccountSid: 'AC_TARGET',
                    phoneNumber: '+61468170318',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.success).toBe(false);
            expect(data.error).toContain('sourceAccountSid');
        });

        it('should reject request without targetAccountSid', async () => {
            const { POST } = await import('@/app/api/twilio/port-number/route');

            const request = new Request('http://localhost/api/twilio/port-number', {
                method: 'POST',
                body: JSON.stringify({
                    sourceAccountSid: 'AC_SOURCE',
                    phoneNumber: '+61468170318',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.success).toBe(false);
            expect(data.error).toContain('targetAccountSid');
        });
    });

    describe('List Numbers Action', () => {
        it('should list numbers in an account', async () => {
            addMockNumber('AC_SOURCE', {
                sid: 'PN_TEST_1',
                phoneNumber: '+61468170318',
                friendlyName: 'Test Number 1',
                accountSid: 'AC_SOURCE',
            });
            addMockNumber('AC_SOURCE', {
                sid: 'PN_TEST_2',
                phoneNumber: '+61485009296',
                friendlyName: 'Test Number 2',
                accountSid: 'AC_SOURCE',
            });

            const { POST } = await import('@/app/api/twilio/port-number/route');

            const request = new Request('http://localhost/api/twilio/port-number', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'list',
                    sourceAccountSid: 'AC_SOURCE',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.numbers).toHaveLength(2);
            expect(data.numbers[0].phoneNumber).toBe('+61468170318');
        });

        it('should list all subaccounts', async () => {
            const { POST } = await import('@/app/api/twilio/port-number/route');

            const request = new Request('http://localhost/api/twilio/port-number', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'list-accounts',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.subAccounts).toHaveLength(3); // AC_SOURCE, AC_TARGET, AC_MASTER
            expect(data.subAccounts.find((a: any) => a.friendlyName === 'Source Account')).toBeTruthy();
        });
    });

    describe('Port US Numbers (Simple)', () => {
        it('should port US number without regulatory requirements', async () => {
            addMockNumber('AC_SOURCE', {
                sid: 'PN_US_1',
                phoneNumber: '+14155551234',
                friendlyName: 'US Number',
                accountSid: 'AC_SOURCE',
            });

            const { POST } = await import('@/app/api/twilio/port-number/route');

            const request = new Request('http://localhost/api/twilio/port-number', {
                method: 'POST',
                body: JSON.stringify({
                    sourceAccountSid: 'AC_SOURCE',
                    targetAccountSid: 'AC_TARGET',
                    phoneNumber: '+14155551234',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.data.phoneNumber).toBe('+14155551234');
            expect(data.data.newAccountSid).toBe('AC_TARGET');

            // Verify number moved
            expect(getMockNumbers('AC_SOURCE')).toHaveLength(0);
            expect(getMockNumbers('AC_TARGET')).toHaveLength(1);
        });
    });

    describe('Port AU Numbers (Regulatory)', () => {
        beforeEach(() => {
            // Setup AU number in source
            addMockNumber('AC_SOURCE', {
                sid: 'PN_AU_1',
                phoneNumber: '+61468170318',
                friendlyName: 'AU Mobile',
                accountSid: 'AC_SOURCE',
            });
        });

        it('should fail if target has no bundles', async () => {
            // No bundles in target
            addMockAddress('AC_TARGET', {
                sid: 'AD_TARGET_1',
                street: '50a Habitat Way',
                city: 'Lennox Head',
                region: 'NSW',
                postalCode: '2478',
                isoCountry: 'AU',
            });

            const { POST } = await import('@/app/api/twilio/port-number/route');

            const request = new Request('http://localhost/api/twilio/port-number', {
                method: 'POST',
                body: JSON.stringify({
                    sourceAccountSid: 'AC_SOURCE',
                    targetAccountSid: 'AC_TARGET',
                    phoneNumber: '+61468170318',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.success).toBe(false);
            expect(data.error).toContain('no approved regulatory bundles');
        });

        it('should successfully port with valid bundle and address', async () => {
            // Setup target with bundle and address
            addMockBundle('AC_TARGET', {
                sid: 'BU_TARGET_1',
                friendlyName: 'AU Mobile Bundle',
                status: 'twilio-approved',
                isoCountry: 'AU',
                numberType: 'mobile',
            });
            addMockAddress('AC_TARGET', {
                sid: 'AD_TARGET_1',
                street: '50a Habitat Way',
                city: 'Lennox Head',
                region: 'NSW',
                postalCode: '2478',
                isoCountry: 'AU',
            });

            const { POST } = await import('@/app/api/twilio/port-number/route');

            const request = new Request('http://localhost/api/twilio/port-number', {
                method: 'POST',
                body: JSON.stringify({
                    sourceAccountSid: 'AC_SOURCE',
                    targetAccountSid: 'AC_TARGET',
                    phoneNumber: '+61468170318',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.data.phoneNumber).toBe('+61468170318');
            expect(data.data.newAccountSid).toBe('AC_TARGET');
        });

        it('should iterate through multiple bundles if first fails', async () => {
            // Setup target with multiple bundles (first one will fail)
            addMockBundle('AC_TARGET', {
                sid: 'BU_BAD_1',
                friendlyName: 'Bad Bundle',
                status: 'twilio-approved',
                isoCountry: 'AU',
                numberType: 'local', // Wrong type
            });
            addMockBundle('AC_TARGET', {
                sid: 'BU_GOOD_1',
                friendlyName: 'Good Bundle',
                status: 'twilio-approved',
                isoCountry: 'AU',
                numberType: 'mobile',
            });
            addMockAddress('AC_TARGET', {
                sid: 'AD_TARGET_1',
                street: '50a Habitat Way',
                city: 'Lennox Head',
                region: 'NSW',
                postalCode: '2478',
                isoCountry: 'AU',
            });

            const { POST } = await import('@/app/api/twilio/port-number/route');

            const request = new Request('http://localhost/api/twilio/port-number', {
                method: 'POST',
                body: JSON.stringify({
                    sourceAccountSid: 'AC_SOURCE',
                    targetAccountSid: 'AC_TARGET',
                    phoneNumber: '+61468170318',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            // Should succeed by trying second bundle
            expect(data.success).toBe(true);
        });

        it('should create address if none exist', async () => {
            addMockBundle('AC_TARGET', {
                sid: 'BU_TARGET_1',
                friendlyName: 'AU Mobile Bundle',
                status: 'twilio-approved',
                isoCountry: 'AU',
            });
            // No addresses - should create one

            const { POST } = await import('@/app/api/twilio/port-number/route');

            const request = new Request('http://localhost/api/twilio/port-number', {
                method: 'POST',
                body: JSON.stringify({
                    sourceAccountSid: 'AC_SOURCE',
                    targetAccountSid: 'AC_TARGET',
                    phoneNumber: '+61468170318',
                }),
            });

            const initialCount = getMockAddresses('AC_TARGET').length;
            const response = await POST(request);
            const data = await response.json();

            // Should create address and succeed
            expect(data.success).toBe(true);
            expect(getMockNumbers('AC_TARGET')[0].phoneNumber).toBe('+61468170318');
            expect(getMockAddresses('AC_TARGET').length).toBe(initialCount + 1);
        });

        it('should reuse existing address if one exists', async () => {
            addMockBundle('AC_TARGET', {
                sid: 'BU_TARGET_1',
                friendlyName: 'AU Mobile Bundle',
                status: 'twilio-approved',
                isoCountry: 'AU',
            });
            addMockAddress('AC_TARGET', {
                sid: 'AD_EXISTING',
                street: '50a Habitat Way',
                city: 'Lennox Head',
                region: 'NSW',
                postalCode: '2478',
                isoCountry: 'AU'
            });

            const { POST } = await import('@/app/api/twilio/port-number/route');

            const request = new Request('http://localhost/api/twilio/port-number', {
                method: 'POST',
                body: JSON.stringify({
                    sourceAccountSid: 'AC_SOURCE',
                    targetAccountSid: 'AC_TARGET',
                    phoneNumber: '+61468170318',
                }),
            });

            const initialCount = getMockAddresses('AC_TARGET').length;
            const response = await POST(request);
            const data = await response.json();

            expect(data.success).toBe(true);
            // Verify no new address was created
            expect(getMockAddresses('AC_TARGET').length).toBe(initialCount);
        });
    });

    describe('Error Handling', () => {
        it('should return 404 if phone number not found', async () => {
            const { POST } = await import('@/app/api/twilio/port-number/route');

            const request = new Request('http://localhost/api/twilio/port-number', {
                method: 'POST',
                body: JSON.stringify({
                    sourceAccountSid: 'AC_SOURCE',
                    targetAccountSid: 'AC_TARGET',
                    phoneNumber: '+61999999999', // Does not exist
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.success).toBe(false);
            expect(data.error).toContain('not found');
        });
    });
});
