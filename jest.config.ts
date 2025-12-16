import type { Config } from 'jest';

const config: Config = {
    displayName: 'awe2m8',
    testEnvironment: 'node',
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            useESM: true,
        }],
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: [
        '<rootDir>/__tests__/**/*.test.ts',
        '<rootDir>/__tests__/**/*.test.tsx',
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    collectCoverageFrom: [
        'src/app/api/**/*.ts',
        '!src/app/api/**/*.d.ts',
    ],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },
    // Separate test projects for unit vs integration
    projects: [
        {
            displayName: 'unit-api',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/__tests__/unit/api/**/*.test.ts'],
            transform: {
                '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
            },
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
            },
        },
        {
            displayName: 'unit-components',
            testEnvironment: 'jsdom',
            testMatch: ['<rootDir>/__tests__/unit/components/**/*.test.tsx'],
            setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
            transform: {
                '^.+\\.tsx?$': ['ts-jest', {
                    useESM: true,
                    tsconfig: {
                        jsx: 'react-jsx'
                    }
                }],
            },
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
            },
        },
        {
            displayName: 'integration',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/__tests__/integration/**/*.test.ts'],
            transform: {
                '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
            },
        },
    ],
};

export default config;
