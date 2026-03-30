
import { GET, DELETE } from '@/app/api/clients/[id]/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/auth');
jest.mock('@/lib/prisma', () => ({
    prisma: {
        client: {
            findUnique: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

const mockAuth = auth as jest.Mock;
const mockFindUnique = prisma.client.findUnique as jest.Mock;
const mockDelete = prisma.client.delete as jest.Mock;

const makeClient = (overrides = {}) => ({
    id: 'acme-corp',
    clientName: 'Acme Corp',
    niche: 'Manufacturing',
    modules: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    ...overrides,
});

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('Clients API - /api/clients/[id]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return 401 if not authenticated', async () => {
            mockAuth.mockResolvedValue(null);
            const req = new Request('http://localhost');
            const response = await GET(req, makeParams('acme-corp'));
            expect(response.status).toBe(401);
        });

        it('should return a client by id', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockFindUnique.mockResolvedValue(makeClient());

            const req = new Request('http://localhost');
            const response = await GET(req, makeParams('acme-corp'));
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.client.id).toBe('acme-corp');
            expect(json.client.clientName).toBe('Acme Corp');
        });

        it('should return 404 for non-existent client', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockFindUnique.mockResolvedValue(null);

            const req = new Request('http://localhost');
            const response = await GET(req, makeParams('missing'));
            const json = await response.json();

            expect(response.status).toBe(404);
            expect(json.error).toMatch(/not found/i);
        });
    });

    describe('DELETE', () => {
        it('should return 401 if not authenticated', async () => {
            mockAuth.mockResolvedValue(null);
            const req = new Request('http://localhost', { method: 'DELETE' });
            const response = await DELETE(req, makeParams('acme-corp'));
            expect(response.status).toBe(401);
        });

        it('should delete a client', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockDelete.mockResolvedValue(makeClient());

            const req = new Request('http://localhost', { method: 'DELETE' });
            const response = await DELETE(req, makeParams('acme-corp'));
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
        });

        it('should handle errors when deleting', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockDelete.mockRejectedValue(new Error('DB error'));

            const req = new Request('http://localhost', { method: 'DELETE' });
            const response = await DELETE(req, makeParams('acme-corp'));

            expect(response.status).toBe(500);
        });
    });
});
