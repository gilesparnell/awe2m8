
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminUsersManager } from '@/components/admin/AdminUsersManager';
import '@testing-library/jest-dom';

// Simple fetch mock
global.fetch = jest.fn();

const mockUsers = [
    { email: 'admin@example.com', name: 'Admin', role: 'admin', lastLogin: 1600000000000 },
    { email: 'other@example.com', name: 'Other', role: 'superadmin', lastLogin: null }
];

describe('AdminUsersManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default success response
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ users: mockUsers })
        });
    });

    it('should render users list', async () => {
        render(<AdminUsersManager currentUserEmail="admin@example.com" />);

        expect(screen.getByText('Loading users...')).toBeInTheDocument();

        // Use findByText to wait for the element to appear
        const adminName = await screen.findByText('Admin');
        expect(adminName).toBeInTheDocument();

        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('should show "You" badge for current user', async () => {
        render(<AdminUsersManager currentUserEmail="admin@example.com" />);
        // Wait for load
        await screen.findByText('Admin');
        expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('should handle add user', async () => {
        render(<AdminUsersManager currentUserEmail="admin@example.com" />);
        await screen.findByText('Admin');

        // Open form
        fireEvent.click(screen.getByText('Add User'));
        expect(screen.getByText('Add New Admin User')).toBeInTheDocument();

        // Fill form
        fireEvent.change(screen.getByPlaceholderText('user@example.com'), { target: { value: 'new@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'New User' } });

        // Override fetch for the POST request
        (global.fetch as jest.Mock).mockImplementation(async (url, options) => {
            if (url === '/api/admin/users' && options.method === 'POST') {
                return {
                    ok: true,
                    json: async () => ({ user: { email: 'new@example.com', name: 'New User', role: 'admin' } })
                };
            }
            // Fallback for re-fetching list
            return {
                ok: true, json: async () => ({
                    users: [
                        { email: 'new@example.com', name: 'New User', role: 'admin', lastLogin: null },
                        ...mockUsers
                    ]
                })
            };
        });

        // Click the submit button (it's the second 'Add User' button now that modal is open)
        const addButtons = screen.getAllByRole('button', { name: 'Add User' });
        fireEvent.click(addButtons[1]);

        // Wait for modal to close or new user to appear
        await waitFor(() => {
            expect(screen.queryByText('Add New Admin User')).not.toBeInTheDocument();
        });

        expect(screen.getByText('New User')).toBeInTheDocument();
    });

    it('should handle delete user', async () => {
        render(<AdminUsersManager currentUserEmail="admin@example.com" />);
        // Wait for list to load
        await screen.findByText('Other');

        const deleteButtons = screen.getAllByTitle('Remove user');
        // Click the first one (should be for 'Other')
        fireEvent.click(deleteButtons[0]);

        // Confirm
        expect(await screen.findByText('Confirm?')).toBeInTheDocument();

        // Mock delete success
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true })
        });

        fireEvent.click(screen.getByText('Yes'));

        // Wait for 'Other' to disappear
        await waitFor(() => {
            expect(screen.queryByText('Other')).not.toBeInTheDocument();
        });
    });
});

