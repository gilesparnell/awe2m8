
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
            accountSid: 'AC_SOURCE',
            customer: 'Acme Corp'
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

            if (body.action === 'list-approved-bundle-countries') {
                const countries = body.subAccountSid === 'AC_TARGET' ? ['AU', 'US'] : ['US'];
                return Promise.resolve({
                    json: () => Promise.resolve({
                        success: true,
                        countries
                    }),
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

            if (body.action === 'update-customer') {
                return Promise.resolve({
                    json: () => Promise.resolve({
                        success: true,
                        data: { sid: body.phoneNumberSid, customer: body.customer?.trim() || '' }
                    }),
                    ok: true
                });
            }

            if (body.action === 'search-available-numbers') {
                return Promise.resolve({
                    json: () => Promise.resolve({
                        success: true,
                        numbers: [
                            { phoneNumber: '+61280001111', locality: 'Sydney', region: 'NSW' }
                        ]
                    }),
                    ok: true
                });
            }

            if (body.action === 'create-number') {
                return Promise.resolve({
                    json: () => Promise.resolve({
                        success: true,
                        data: { phoneNumber: body.phoneNumber, sid: 'PN_NEW_1', accountSid: body.subAccountSid }
                    }),
                    ok: true
                });
            }

            return Promise.reject(new Error('Unknown request'));
        });
    });

    it('renders and fetches data on mount', async () => {
        render(<NumberManager credentials={mockCredentials} />);

        // Check for loading state or content
        expect(screen.getByText('Number Manager')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Move Numbers' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create New Number' })).toBeInTheDocument();

        // Wait for move tab content to appear
        await waitFor(() => {
            expect(screen.getByText('Source Account')).toBeInTheDocument();
            expect(screen.getByText('Target Account')).toBeInTheDocument();
        });

        // Check for number
        expect(screen.getByText('+1234567890')).toBeInTheDocument();
        expect(screen.getByText(/Customer: Acme Corp/i)).toBeInTheDocument();
    });

    it('opens dropdown and executes move on click', async () => {
        render(<NumberManager credentials={mockCredentials} />);

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
        fireEvent.click(targetOption);

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

    it('updates customer note for a number', async () => {
        render(<NumberManager credentials={mockCredentials} />);

        await waitFor(() => {
            expect(screen.getByText('+1234567890')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTitle('Edit Customer'));

        const input = screen.getByPlaceholderText('Optional customer');
        fireEvent.change(input, { target: { value: 'Beta Client' } });

        fireEvent.click(screen.getByTitle('Save Customer'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/twilio/port-number', expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"action":"update-customer"')
            }));
        });

        await waitFor(() => {
            expect(screen.getByText(/Customer: Beta Client/i)).toBeInTheDocument();
        });
    });

    it('filters numbers by customer text', async () => {
        render(<NumberManager credentials={mockCredentials} />);

        await waitFor(() => {
            expect(screen.getByText('+1234567890')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText('Search numbers by customer'), { target: { value: 'Acme' } });
        expect(screen.getByText('+1234567890')).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('Search numbers by customer'), { target: { value: 'Missing Customer' } });
        expect(screen.queryByText('+1234567890')).not.toBeInTheDocument();
        expect(screen.getByText(/No matching customers/i)).toBeInTheDocument();
    });

    it('searches and creates a new number for selected subaccount', async () => {
        render(<NumberManager credentials={mockCredentials} />);

        fireEvent.click(screen.getByRole('button', { name: 'Create New Number' }));

        await waitFor(() => {
            expect(screen.getByText('Create Twilio Number')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByRole('option', { name: 'Target Account' })).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText('Subaccount'), { target: { value: 'AC_TARGET' } });

        const findAvailableButton = screen.getByRole('button', { name: 'Find Available' });
        await waitFor(() => {
            expect(findAvailableButton).not.toBeDisabled();
        });
        fireEvent.click(findAvailableButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/twilio/port-number', expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"action":"search-available-numbers"')
            }));
        });

        const createNumberButton = screen.getByRole('button', { name: 'Create Number' });
        await waitFor(() => {
            expect(createNumberButton).not.toBeDisabled();
        });
        fireEvent.click(createNumberButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/twilio/port-number', expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"action":"create-number"')
            }));
        });

        await waitFor(() => {
            expect(screen.getByText(/Successfully created \+61280001111/i)).toBeInTheDocument();
        });
    });
});
