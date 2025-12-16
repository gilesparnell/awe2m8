
import { isAdminEmail, getAdminUser, updateLastLogin } from '@/lib/firebase-admin';

// Define mocks before jest.mock calls (or use jest.mock factory to reference them if hoisted, but safer to inline or use variable hoisting)

// Hoistable mocks
const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockDoc = jest.fn((id) => ({
    get: mockGet,
    update: mockUpdate,
    id: id
}));
const mockCollection = jest.fn((name) => ({
    doc: mockDoc
}));
const mockGetFirestore = jest.fn(() => ({
    collection: mockCollection
}));

// Mock the modules
jest.mock('firebase-admin/app', () => ({
    initializeApp: jest.fn(),
    getApps: jest.fn(() => []), // Simulate no apps init
    cert: jest.fn(),
}));

jest.mock('firebase-admin/firestore', () => ({
    // Using a function to return the mock ensures it's available
    getFirestore: (...args: any[]) => mockGetFirestore(...args)
}));

describe('Firebase Admin Store (Backend User Store)', () => {
    // Setup env vars
    const ORIGINAL_ENV = process.env;

    beforeAll(() => {
        process.env = {
            ...ORIGINAL_ENV,
            FIREBASE_ADMIN_PROJECT_ID: 'test-project',
            FIREBASE_ADMIN_CLIENT_EMAIL: 'test@example.com',
            FIREBASE_ADMIN_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD\n-----END PRIVATE KEY-----'
        };
    });

    afterAll(() => {
        process.env = ORIGINAL_ENV;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockGet.mockReset();
        mockUpdate.mockReset();
    });

    describe('isAdminEmail', () => {
        it('should return true if user document exists', async () => {
            // Setup exists=true
            mockGet.mockResolvedValue({ exists: true });

            const email = 'admin@example.com';
            const result = await isAdminEmail(email);

            expect(result).toBe(true);
            expect(mockCollection).toHaveBeenCalledWith('admin_users');
            expect(mockDoc).toHaveBeenCalledWith('admin@example.com');
        });

        it('should return false if user document does not exist', async () => {
            // Setup exists=false
            mockGet.mockResolvedValue({ exists: false });

            const email = 'stranger@example.com';
            const result = await isAdminEmail(email);

            expect(result).toBe(false);
        });

        it('should normalize email to lowercase', async () => {
            mockGet.mockResolvedValue({ exists: true });
            await isAdminEmail('Admin@Example.COM');
            expect(mockDoc).toHaveBeenCalledWith('admin@example.com');
        });
    });

    describe('getAdminUser', () => {
        it('should return user data if exists', async () => {
            const mockData = {
                role: 'superadmin',
                name: 'Super User'
            };

            mockGet.mockResolvedValue({
                exists: true,
                id: 'admin@example.com',
                data: () => mockData
            });

            const user = await getAdminUser('admin@example.com');

            expect(user).toBeDefined();
            expect(user?.email).toBe('admin@example.com');
            expect(user?.role).toBe('superadmin');
            expect(user?.name).toBe('Super User');
        });

        it('should return null if user does not exist', async () => {
            mockGet.mockResolvedValue({ exists: false });

            const user = await getAdminUser('unknown@example.com');

            expect(user).toBeNull();
        });
    });

    describe('updateLastLogin', () => {
        it('should update lastLogin timestamp', async () => {
            mockUpdate.mockResolvedValue({}); // update returns a WriteResult usually

            const email = 'user@example.com';
            await updateLastLogin(email);

            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                lastLogin: expect.any(Number)
            }));
        });
    });
});
