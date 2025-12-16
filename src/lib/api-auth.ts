
import { auth } from '@/lib/auth';

/**
 * Checks if the request is authenticated via session OR via a valid test API key.
 * This allows integration tests to bypass UI login.
 */
export async function isAuthenticated(req: Request): Promise<boolean> {
    // 1. Check for standard NextAuth session
    const session = await auth();
    if (session?.user?.email) {
        return true;
    }

    // 2. Check for Test API Key (Bypass for Integration Tests)
    // Only allow this if the server environment has a test key configured.
    // This prevents accidental exposure if the env var is missing.
    const serverKey = process.env.TEST_API_KEY;
    if (serverKey) {
        const clientKey = req.headers.get('x-test-api-key');
        if (clientKey === serverKey) {
            console.log('⚠️ [Auth] Authenticated via Test API Key');
            return true;
        }
    }

    return false;
}
