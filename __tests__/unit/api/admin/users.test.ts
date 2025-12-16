
import { GET, POST, DELETE } from '@/app/api/admin/users/route';
import { auth } from '@/lib/auth';
import { listAdminUsers, addAdminUser, deleteAdminUser } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/firebase-admin');

const mockAuth = auth as jest.Mock;
const mockListUsers = listAdminUsers as jest.Mock;
const mockAddUser = addAdminUser as jest.Mock;
const mockDeleteUser = deleteAdminUser as jest.Mock;

describe('Admin Users API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return 401 if not authenticated', async () => {
            mockAuth.mockResolvedValue(null);
            const response = await GET();
            const json = await response.json();

            expect(response.status).toBe(401);
            expect(json.error).toBe('Unauthorized');
        });

        it('should list users if authenticated', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@example.com' } });
            const mockUsers = [{ email: 'user@example.com', role: 'admin' }];
            mockListUsers.mockResolvedValue(mockUsers);

            const response = await GET();
            const json = await response.json();

            expect(response.status).toBe(200); // NextResponse defaults to 200
            expect(json.users).toEqual(mockUsers);
        });

        it('should handle errors', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@example.com' } });
            mockListUsers.mockRejectedValue(new Error('DB Error'));

            const response = await GET();
            const json = await response.json();

            expect(response.status).toBe(500);
            expect(json.error).toBe('DB Error');
        });
    });

    describe('POST', () => {
        it('should return 401 if not authenticated', async () => {
            mockAuth.mockResolvedValue(null);
            const req = new Request('http://localhost', { method: 'POST' });
            const response = await POST(req);

            expect(response.status).toBe(401);
        });

        it('should validate missing fields', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@example.com' } });
            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ email: '' })
            });

            const response = await POST(req);
            expect(response.status).toBe(400);
        });

        it('should create user successfully', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@example.com' } });
            mockAddUser.mockResolvedValue({ email: 'new@example.com', role: 'admin' });

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ email: 'new@example.com', name: 'New User' })
            });

            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(201);
            expect(json.user.email).toBe('new@example.com');
        });
    });

    describe('DELETE', () => {
        it('should return 401 if not authenticated', async () => {
            mockAuth.mockResolvedValue(null);
            const req = new Request('http://localhost', { method: 'DELETE' });
            const response = await DELETE(req);

            expect(response.status).toBe(401);
        });

        it('should prevent self-deletion', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@example.com' } });
            const req = new Request('http://localhost', {
                method: 'DELETE',
                body: JSON.stringify({ email: 'admin@example.com' })
            });

            const response = await DELETE(req);
            const json = await response.json();

            expect(response.status).toBe(400);
            expect(json.error).toMatch(/own account/);
        });

        it('should delete user successfully', async () => {
            mockAuth.mockResolvedValue({ user: { email: 'admin@example.com' } });
            mockDeleteUser.mockResolvedValue(undefined);

            const req = new Request('http://localhost', {
                method: 'DELETE',
                body: JSON.stringify({ email: 'other@example.com' })
            });

            const response = await DELETE(req);

            expect(response.status).toBe(200);
            expect(mockDeleteUser).toHaveBeenCalledWith('other@example.com');
        });
    });
});
