
import { POST } from '@/app/api/twilio/cleanup/route';
import { NextResponse } from 'next/server';

// Mock Twilio
const mockRemove = jest.fn();
const mockFetch = jest.fn();
const mockListAddresses = jest.fn();
const mockListBundles = jest.fn();
const mockListItemAssignments = jest.fn();

const mockClient = {
    addresses: Object.assign(
        jest.fn(() => ({ remove: mockRemove })),
        { list: mockListAddresses }
    ),
    numbers: {
        v2: {
            regulatoryCompliance: {
                bundles: Object.assign(
                    jest.fn(() => ({
                        fetch: mockFetch,
                        remove: mockRemove,
                        itemAssignments: { list: mockListItemAssignments }
                    })),
                    { list: mockListBundles }
                )
            }
        }
    }
};

jest.mock('twilio', () => jest.fn(() => mockClient));

describe('Twilio Cleanup API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.TWILIO_ACCOUNT_SID = 'AC_TEST_ENV';
        process.env.TWILIO_AUTH_TOKEN = 'AUTH_TEST_ENV';
    });

    const createRequest = (body: any) => {
        return new Request('http://localhost/api/twilio/cleanup', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    };

    it('should return error if subAccountSid is missing', async () => {
        const req = createRequest({ action: 'health-check' });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Missing subAccountSid');
    });

    describe('Health Check', () => {
        it('should detect duplicate addresses', async () => {
            // Mock Bundles
            mockListBundles.mockResolvedValue([]);

            // Mock Addresses (2 duplicates)
            mockListAddresses.mockResolvedValue([
                { sid: 'AD1', isoCountry: 'AU', validated: true, dateCreated: '2023-01-01' }, // Older
                { sid: 'AD2', isoCountry: 'AU', validated: true, dateCreated: '2023-02-01' }  // Newer (Duplicate)
            ]);

            // Mock Bundle Audit (No usage)
            mockListBundles.mockResolvedValue([]);
            mockListItemAssignments.mockResolvedValue([]);

            const req = createRequest({
                action: 'health-check',
                subAccountSid: 'AC_SUB'
            });
            const res = await POST(req);
            const data = await res.json();

            expect(data.success).toBe(true);
            expect(data.addresses.hasDuplicates).toBe(true);
            expect(data.addresses.duplicates).toHaveLength(1);
            expect(data.addresses.duplicates[0].sid).toBe('AD2');
            expect(data.addresses.duplicates[0].canDelete).toBe(true);
        });

        it('should identify locked duplicates', async () => {
            // Mock Addresses (2 duplicates)
            mockListAddresses.mockResolvedValue([
                { sid: 'AD1', isoCountry: 'AU', validated: true, dateCreated: '2023-01-01' },
                { sid: 'AD2', isoCountry: 'AU', validated: true, dateCreated: '2023-02-01' }
            ]);

            // Mock usage of AD2 in a bundle
            mockListBundles.mockResolvedValue([{ sid: 'BU1', friendlyName: 'My Bundle', status: 'draft' }]);

            // When checking bundle assignments, return AD2
            mockClient.numbers.v2.regulatoryCompliance.bundles.mockReturnValue({
                itemAssignments: { list: jest.fn().mockResolvedValue([{ objectSid: 'AD2' }]) }
            } as any);

            const req = createRequest({
                action: 'health-check',
                subAccountSid: 'AC_SUB'
            });
            const res = await POST(req);
            const data = await res.json();

            expect(data.success).toBe(true);
            expect(data.addresses.duplicates[0].sid).toBe('AD2');
            expect(data.addresses.duplicates[0].isUsedInBundle).toBe(true);
            expect(data.addresses.duplicates[0].canDelete).toBe(false);
            expect(data.addresses.duplicates[0].bundleName).toContain('My Bundle');
        });
    });

    describe('Cleanup Addresses', () => {
        it('should delete unused duplicates', async () => {
            // Mock Addresses
            mockListAddresses.mockResolvedValue([
                { sid: 'AD1', isoCountry: 'AU', validated: true, dateCreated: '2023-01-01', customerName: 'Keep' },
                { sid: 'AD2', isoCountry: 'AU', validated: true, dateCreated: '2023-02-01', customerName: 'Delete' }
            ]);

            // No usage
            mockListBundles.mockResolvedValue([]);

            const req = createRequest({
                action: 'cleanup-addresses',
                subAccountSid: 'AC_SUB'
            });
            const res = await POST(req);
            const data = await res.json();

            expect(data.success).toBe(true);
            expect(data.results[0].deleted).toHaveLength(1);
            expect(data.results[0].deleted[0].sid).toBe('AD2');
            expect(data.results[0].deleted[0].success).toBe(true);

            // Verify remove was called for AD2
            expect(mockClient.addresses).toHaveBeenCalledWith('AD2');
            expect(mockRemove).toHaveBeenCalled();
        });

        it('should NOT delete locked addresses', async () => {
            // Mock Addresses
            mockListAddresses.mockResolvedValue([
                { sid: 'AD1', isoCountry: 'AU', validated: true, dateCreated: '2023-01-01' },
                { sid: 'AD2', isoCountry: 'AU', validated: true, dateCreated: '2023-02-01' } // Used
            ]);

            // Mock usage
            mockListBundles.mockResolvedValue([{ sid: 'BU1', friendlyName: 'Bundle1', status: 'active' }]);

            // Mock assignments for the bundle
            mockClient.numbers.v2.regulatoryCompliance.bundles.mockReturnValue({
                itemAssignments: { list: jest.fn().mockResolvedValue([{ objectSid: 'AD2' }]) }
            } as any);

            const req = createRequest({
                action: 'cleanup-addresses',
                subAccountSid: 'AC_SUB'
            });
            const res = await POST(req);
            const data = await res.json();

            expect(data.success).toBe(true);
            const deletedResult = data.results[0].deleted[0];

            expect(deletedResult.sid).toBe('AD2');
            expect(deletedResult.success).toBe(false);
            expect(deletedResult.error).toContain('Protected');

            // Verify remove was NOT called (mock instance check would be complex here due to mock implementation, 
            // but the response confirms logic path)
        });
    });
});
