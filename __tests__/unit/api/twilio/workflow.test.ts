
import {
    resetMockState,
    addMockAccount,
    addMockNumber,
    addMockBundle,
    addMockAddress,
    getMockNumbers,
    getMockAddresses,
    createMockTwilioClient,
} from '../../../mocks/twilio.mock';

// Mock Modules
jest.mock('twilio', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(createMockTwilioClient),
}));

jest.mock('next/server', () => ({
    NextResponse: {
        json: (data: any, init?: { status?: number }) => ({
            json: async () => data,
            status: init?.status || 200,
            ...data,
        }),
    },
}));

describe('Workflow API (Porting Logic)', () => {
    beforeEach(() => {
        process.env.TWILIO_ACCOUNT_SID = 'AC_MASTER';
        process.env.TWILIO_AUTH_TOKEN = 'AUTH_TOKEN';
        resetMockState();
        addMockAccount('AC_MASTER', 'Master Account');
        addMockAccount('AC_SOURCE', 'Source Account');
        addMockAccount('AC_TARGET', 'Target Account');
    });

    it('should reuse existing address for AU Porting (Standard Loop)', async () => {
        // Setup Source Number
        addMockNumber('AC_SOURCE', {
            sid: 'PN_AU_1',
            phoneNumber: '+61411222333',
            friendlyName: 'AU Mobile',
            accountSid: 'AC_SOURCE',
        });

        // Setup Target Bundle & Address
        addMockBundle('AC_TARGET', {
            sid: 'BU_1',
            friendlyName: 'Bundle',
            status: 'twilio-approved',
            isoCountry: 'AU',
            numberType: 'mobile'
        });

        addMockAddress('AC_TARGET', {
            sid: 'AD_EXISTING',
            street: '123 Test St',
            city: 'Sydney',
            region: 'NSW',
            postalCode: '2000',
            isoCountry: 'AU'
        });

        // Import Handler
        const { POST } = await import('@/app/api/twilio/workflow/route');

        const req = new Request('http://localhost/api/twilio/workflow', {
            method: 'POST',
            body: JSON.stringify({
                action: 'port',
                sourceAccountSid: 'AC_SOURCE',
                targetAccountSid: 'AC_TARGET',
                phoneNumber: '+61411222333'
            })
        });

        const initialAddrCount = getMockAddresses('AC_TARGET').length;
        expect(initialAddrCount).toBe(1);

        const res = await POST(req);
        const data = await res.json();

        expect(data.success).toBe(true);
        expect(data.data.newAccountSid).toBe('AC_TARGET');

        // CRITICAL: Ensure no new address was created
        const finalAddrCount = getMockAddresses('AC_TARGET').length;
        expect(finalAddrCount).toBe(initialAddrCount);
    });
});
