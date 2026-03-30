
import { GET, POST } from '@/app/api/clients/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/auth');
jest.mock('@/lib/prisma', () => ({
    prisma: {
        client: {
            findMany: jest.fn(),
            upsert: jest.fn(),
        },
    },
}));

const mockAuth = auth as jest.Mock;
const mockFindMany = prisma.client.findMany as jest.Mock;
const mockUpsert = prisma.client.upsert as jest.Mock;

const makeClient = (overrides = {}) => ({
    id: 'acme-corp',
    clientName: 'Acme Corp',
    niche: 'Manufacturing',
    modules: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    ...overrides,
});

describe('Clients API - /api/clients', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return 401 if not authenticated', async () => {
            mockAuth.mockResolvedValue(null);
            const response = await GET();
            expect(response.status).toBe(401);
        });

        it('should list clients when authenticated', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockFindMany.mockResolvedValue([makeClient()]);

            const response = await GET();
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.clients).toHaveLength(1);
            expect(json.clients[0].id).toBe('acme-corp');
            expect(json.clients[0].createdAt).toBe(new Date('2026-01-01').getTime());
        });

        it('should handle database errors', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockFindMany.mockRejectedValue(new Error('DB error'));

            const response = await GET();
            const json = await response.json();

            expect(response.status).toBe(500);
            expect(json.success).toBe(false);
        });
    });

    describe('POST', () => {
        it('should return 401 if not authenticated', async () => {
            mockAuth.mockResolvedValue(null);
            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ id: 'test', clientName: 'Test' }),
            });
            const response = await POST(req);
            expect(response.status).toBe(401);
        });

        it('should upsert a client with valid data', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockUpsert.mockResolvedValue(makeClient());

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({
                    id: 'acme-corp',
                    clientName: 'Acme Corp',
                    niche: 'Manufacturing',
                    modules: [],
                }),
            });

            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.client.clientName).toBe('Acme Corp');
        });

        it('should reject missing id', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ clientName: 'Test' }),
            });

            const response = await POST(req);
            expect(response.status).toBe(400);
        });

        it('should reject missing clientName', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ id: 'test' }),
            });

            const response = await POST(req);
            expect(response.status).toBe(400);
        });

        it('should reject reserved slugs', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });

            // Only test reserved slugs that pass the slug format check
            for (const reserved of ['admin', 'api', 'login', 'ghl-triggers', 'demos', 'twilio']) {
                const req = new Request('http://localhost', {
                    method: 'POST',
                    body: JSON.stringify({ id: reserved, clientName: 'Test' }),
                });

                const response = await POST(req);
                const json = await response.json();

                expect(response.status).toBe(400);
                expect(json.error).toMatch(/reserved/i);
            }
        });

        it('should reject invalid slug formats', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });

            const invalidSlugs = ['UPPERCASE', 'has spaces', '-leading-dash', 'a', ''];

            for (const slug of invalidSlugs) {
                const req = new Request('http://localhost', {
                    method: 'POST',
                    body: JSON.stringify({ id: slug, clientName: 'Test' }),
                });

                const response = await POST(req);
                expect(response.status).toBe(400);
            }
        });

        it('should accept valid slugs', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@test.com' } });
            mockUpsert.mockResolvedValue(makeClient({ id: 'valid-slug-123' }));

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ id: 'valid-slug-123', clientName: 'Test' }),
            });

            const response = await POST(req);
            expect(response.status).toBe(200);
        });
    });
});
