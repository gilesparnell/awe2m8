
import { GET, POST } from '@/app/api/ghl-triggers/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/auth');
jest.mock('@/lib/prisma', () => ({
    prisma: {
        ghlTrigger: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

const mockAuth = auth as jest.Mock;
const mockFindMany = prisma.ghlTrigger.findMany as jest.Mock;
const mockFindUnique = prisma.ghlTrigger.findUnique as jest.Mock;
const mockCreate = prisma.ghlTrigger.create as jest.Mock;

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

describe('GHL Triggers API - /api/ghl-triggers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return 401 if not authenticated', async () => {
            mockAuth.mockResolvedValue(null);
            const response = await GET();
            expect(response.status).toBe(401);
        });

        it('should list triggers when authenticated', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            const trigger = makeTrigger();
            mockFindMany.mockResolvedValue([trigger]);

            const response = await GET();
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.triggers).toHaveLength(1);
            expect(json.triggers[0].id).toBe('test-trigger');
            expect(json.triggers[0].createdAt).toBe(new Date('2026-01-01').getTime());
        });

        it('should return empty array when no triggers exist', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockFindMany.mockResolvedValue([]);

            const response = await GET();
            const json = await response.json();

            expect(json.success).toBe(true);
            expect(json.triggers).toEqual([]);
        });

        it('should handle database errors', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockFindMany.mockRejectedValue(new Error('Connection failed'));

            const response = await GET();
            const json = await response.json();

            expect(response.status).toBe(500);
            expect(json.success).toBe(false);
            expect(json.error).toBe('Failed to fetch triggers');
        });
    });

    describe('POST', () => {
        it('should return 401 if not authenticated', async () => {
            mockAuth.mockResolvedValue(null);
            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ name: 'Test', code: '<div/>' }),
            });
            const response = await POST(req);
            expect(response.status).toBe(401);
        });

        it('should create a trigger with valid data', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockFindUnique.mockResolvedValue(null);
            const trigger = makeTrigger();
            mockCreate.mockResolvedValue(trigger);

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ name: 'Test Trigger', code: '<div>test</div>', description: 'A test' }),
            });

            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.trigger.name).toBe('Test Trigger');
        });

        it('should slugify the name into an id', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockFindUnique.mockResolvedValue(null);
            mockCreate.mockImplementation(({ data }) => Promise.resolve(makeTrigger({ id: data.id })));

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ name: 'My Cool Trigger!', code: '<div/>' }),
            });

            await POST(req);

            expect(mockCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ id: 'my-cool-trigger' }),
                })
            );
        });

        it('should reject missing name', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ code: '<div/>' }),
            });

            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(400);
            expect(json.error).toMatch(/Name and code are required/);
        });

        it('should reject missing code', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ name: 'Test' }),
            });

            const response = await POST(req);
            expect(response.status).toBe(400);
        });

        it('should reject duplicate trigger names', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockFindUnique.mockResolvedValue(makeTrigger());

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ name: 'Test Trigger', code: '<div/>' }),
            });

            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(409);
            expect(json.error).toMatch(/already exists/);
        });

        it('should reject names that produce empty slugs', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ name: '!!!', code: '<div/>' }),
            });

            const response = await POST(req);
            expect(response.status).toBe(400);
            const json = await response.json();
            expect(json.error).toMatch(/valid characters/);
        });
    });
});
