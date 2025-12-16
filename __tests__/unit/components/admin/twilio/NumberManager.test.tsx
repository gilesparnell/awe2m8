
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { NumberManager } from '@/components/admin/twilio/NumberManager';
import confetti from 'canvas-confetti';

// Mock confetti
jest.mock('canvas-confetti', () => jest.fn());

// Mock fetch
global.fetch = jest.fn();

const mockCredentials = {
    accountSid: 'AC_MASTER',
    authToken: 'AUTH_TOKEN'
};

const mockSubAccountsResponse = {
    subAccounts: [
        { sid: 'AC_SOURCE', friendlyName: 'Source Account' },
        { sid: 'AC_TARGET', friendlyName: 'Target Account' }
    ]
};

const mockNumbersResponseSource = {
    success: true,
    numbers: [
        {
            sid: 'PN123',
            phoneNumber: '+1234567890',
            friendlyName: 'My Number',
            accountSid: 'AC_SOURCE'
        }
    ]
};

const mockNumbersResponseTarget = {
    success: true,
    numbers: []
};

const mockPortSuccessResponse = {
    success: true
};

describe('NumberManager Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default mocks
        (global.fetch as jest.Mock).mockImplementation((url, options) => {
            const body = options.body ? JSON.parse(options.body) : {};

            if (body.action === 'list-accounts') {
                return Promise.resolve({
                    json: () => Promise.resolve(mockSubAccountsResponse),
                    ok: true
                });
            }

            if (body.action === 'list') {
                if (body.sourceAccountSid === 'AC_SOURCE') {
                    return Promise.resolve({
                        json: () => Promise.resolve(mockNumbersResponseSource),
                        ok: true
                    });
                }
                return Promise.resolve({
                    json: () => Promise.resolve(mockNumbersResponseTarget),
                    ok: true
                });
            }

            // Port action
            if (url.includes('port-number') && body.targetAccountSid) {
                return Promise.resolve({
                    json: () => Promise.resolve(mockPortSuccessResponse),
                    ok: true
                });
            }

            return Promise.reject(new Error('Unknown request'));
        });
    });

    it('renders and fetches data on mount', async () => {
        await act(async () => {
            render(<NumberManager credentials={mockCredentials} />);
        });

        // Check for loading state or content
        expect(screen.getByText('Number Manager')).toBeInTheDocument();

        // Wait for accounts to appear
        await waitFor(() => {
            expect(screen.getByText('Source Account')).toBeInTheDocument();
            expect(screen.getByText('Target Account')).toBeInTheDocument();
        });

        // Check for number
        expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });

    it('opens dropdown and executes move on click', async () => {
        await act(async () => {
            render(<NumberManager credentials={mockCredentials} />);
        });

        await waitFor(() => {
            expect(screen.getByText('+1234567890')).toBeInTheDocument();
        });

        // Find move button (arrow right icon)
        const moveButtons = screen.getAllByTitle('Move Number');
        const moveButton = moveButtons[0];

        // Click to open dropdown
        fireEvent.click(moveButton);

        // Expect dropdown to show target account
        const targetOption = screen.getByRole('button', { name: 'Target Account' });
        expect(targetOption).toBeVisible();

        // Click target account to move
        await act(async () => {
            fireEvent.click(targetOption);
        });

        // Check API call
        expect(global.fetch).toHaveBeenCalledWith('/api/twilio/port-number', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"targetAccountSid":"AC_TARGET"')
        }));

        expect(global.fetch).toHaveBeenCalledWith('/api/twilio/port-number', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"phoneNumberSid":"PN123"')
        }));

        // Check success message and confetti
        await waitFor(() => {
            expect(screen.getByText(/Successfully moved/i)).toBeInTheDocument();
        });

        expect(confetti).toHaveBeenCalled();
    });
});
