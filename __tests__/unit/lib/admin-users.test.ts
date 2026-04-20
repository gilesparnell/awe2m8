import { updateLastLogin } from '@/lib/admin-users';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        adminUser: {
            update: jest.fn(),
        },
    },
}));

const mockUpdate = (prisma as unknown as {
    adminUser: { update: jest.Mock }
}).adminUser.update;

describe('updateLastLogin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUpdate.mockResolvedValue(undefined);
    });

    it('updates lastLogin when called with email only (backward-compatible signature)', async () => {
        await updateLastLogin('admin@example.com');

        expect(mockUpdate).toHaveBeenCalledTimes(1);
        const call = mockUpdate.mock.calls[0][0];
        expect(call.where).toEqual({ email: 'admin@example.com' });
        expect(call.data.lastLogin).toBeInstanceOf(Date);
        expect(call.data).not.toHaveProperty('name');
    });

    it('lowercases the email in the where clause', async () => {
        await updateLastLogin('Admin@Example.COM');

        const call = mockUpdate.mock.calls[0][0];
        expect(call.where).toEqual({ email: 'admin@example.com' });
    });

    it('syncs name from Google profile when googleName is provided', async () => {
        await updateLastLogin('admin@example.com', 'Giles Parnell');

        const call = mockUpdate.mock.calls[0][0];
        expect(call.data.name).toBe('Giles Parnell');
        expect(call.data.lastLogin).toBeInstanceOf(Date);
    });

    it('does NOT include name in the update when googleName is null', async () => {
        await updateLastLogin('admin@example.com', null);

        const call = mockUpdate.mock.calls[0][0];
        expect(call.data).not.toHaveProperty('name');
        expect(call.data.lastLogin).toBeInstanceOf(Date);
    });

    it('does NOT include name in the update when googleName is undefined', async () => {
        await updateLastLogin('admin@example.com', undefined);

        const call = mockUpdate.mock.calls[0][0];
        expect(call.data).not.toHaveProperty('name');
    });

    it('does NOT include name in the update when googleName is empty string', async () => {
        await updateLastLogin('admin@example.com', '');

        const call = mockUpdate.mock.calls[0][0];
        expect(call.data).not.toHaveProperty('name');
    });
});
