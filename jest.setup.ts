import '@testing-library/jest-dom';
import { loadEnvConfig } from '@next/env';
import path from 'path';

// Load environment variables from all .env files using Next.js logic
loadEnvConfig(process.cwd());

// Global test timeout
jest.setTimeout(30000);

// Silence console during tests unless DEBUG is set
if (!process.env.DEBUG) {
    global.console = {
        ...console,
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
}
