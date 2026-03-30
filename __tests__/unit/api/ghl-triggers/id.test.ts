
import { GET, PUT, DELETE } from '@/app/api/ghl-triggers/[id]/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/auth');
jest.mock('@/lib/prisma', () => ({
    prisma: {
        ghlTrigger: {
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

const mockAuth = auth as jest.Mock;
const mockFindUnique = prisma.ghlTrigger.findUnique as jest.Mock;
const mockUpdate = prisma.ghlTrigger.update as jest.Mock;
const mockDelete = prisma.ghlTrigger.delete as jest.Mock;

const makeTrigger = (overrides = {}) => ({
    id: 'test-trigger',
    name: 'Test Trigger',
    code: '<div>test</div>',
    description: 'A test trigger',
    createdBy: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    ...overrides,
});

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('GHL Triggers API - /api/ghl-triggers/[id]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return 401 if not authenticated', async () => {
            mockAuth.mockResolvedValue(null);
            const req = new Request('http://localhost');
            const response = await GET(req, makeParams('test-trigger'));
            expect(response.status).toBe(401);
        });

        it('should return a trigger by id', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockFindUnique.mockResolvedValue(makeTrigger());

            const req = new Request('http://localhost');
            const response = await GET(req, makeParams('test-trigger'));
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.trigger.id).toBe('test-trigger');
        });

        it('should return 404 for non-existent trigger', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockFindUnique.mockResolvedValue(null);

            const req = new Request('http://localhost');
            const response = await GET(req, makeParams('missing'));
            const json = await response.json();

            expect(response.status).toBe(404);
            expect(json.error).toMatch(/not found/i);
        });
    });

    describe('PUT', () => {
        it('should return 401 if not authenticated', async () => {
            mockAuth.mockResolvedValue(null);
            const req = new Request('http://localhost', {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated' }),
            });
            const response = await PUT(req, makeParams('test-trigger'));
            expect(response.status).toBe(401);
        });

        it('should update a trigger', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            const updated = makeTrigger({ name: 'Updated Name' });
            mockUpdate.mockResolvedValue(updated);

            const req = new Request('http://localhost', {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated Name' }),
            });

            const response = await PUT(req, makeParams('test-trigger'));
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.trigger.name).toBe('Updated Name');
        });

        it('should return 404 when updating non-existent trigger', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockUpdate.mockRejectedValue({ code: 'P2025' });

            const req = new Request('http://localhost', {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated' }),
            });

            const response = await PUT(req, makeParams('missing'));
            expect(response.status).toBe(404);
        });
    });

    describe('DELETE', () => {
        it('should return 401 if not authenticated', async () => {
            mockAuth.mockResolvedValue(null);
            const req = new Request('http://localhost', { method: 'DELETE' });
            const response = await DELETE(req, makeParams('test-trigger'));
            expect(response.status).toBe(401);
        });

        it('should delete a trigger', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockDelete.mockResolvedValue(makeTrigger());

            const req = new Request('http://localhost', { method: 'DELETE' });
            const response = await DELETE(req, makeParams('test-trigger'));
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
        });

        it('should return 404 when deleting non-existent trigger', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockDelete.mockRejectedValue({ code: 'P2025' });

            const req = new Request('http://localhost', { method: 'DELETE' });
            const response = await DELETE(req, makeParams('missing'));
            expect(response.status).toBe(404);
        });
    });
});
