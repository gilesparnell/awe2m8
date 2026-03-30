
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminState } from '@/hooks/useAdminState';

// Mock fetch
global.fetch = jest.fn();

const mockClients = [
    { id: 'acme-corp', clientName: 'Acme Corp', niche: 'Manufacturing', modules: [], createdAt: 1700000000000 },
    { id: 'beta-inc', clientName: 'Beta Inc', niche: 'Tech', modules: [], createdAt: 1700000001000 },
];

const mockClientDetail = {
    success: true,
    client: {
        id: 'acme-corp',
        clientName: 'Acme Corp',
        niche: 'Manufacturing',
        modules: [{ id: 'hero', type: 'hero', headline: 'Welcome' }],
    },
};

describe('useAdminState', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockImplementation((url: string) => {
            if (url === '/api/clients' && !url.includes('/api/clients/')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true, clients: mockClients }),
                });
            }
            if (url.startsWith('/api/clients/')) {
                const id = url.split('/api/clients/')[1];
                if (id === 'acme-corp') {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockClientDetail),
                    });
                }
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useAdminState());

        expect(result.current.mode).toBe('create');
        expect(result.current.step).toBe('input');
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('');
        expect(result.current.existingPages).toEqual([]);
        expect(result.current.selectedModules).toEqual(['hero', 'voice_ai', 'sms_agent', 'chat_bot', 'why_it_matters']);
    });

    it('should load existing pages when switching to edit mode', async () => {
        const { result } = renderHook(() => useAdminState());

        act(() => {
            result.current.handleModeChange('edit');
        });

        expect(result.current.mode).toBe('edit');

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/clients');
        expect(result.current.existingPages).toEqual(mockClients);
    });

    it('should load a specific page for editing', async () => {
        const { result } = renderHook(() => useAdminState());

        await act(async () => {
            await result.current.loadPageForEditing('acme-corp');
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/clients/acme-corp');
        expect(result.current.clientName).toBe('Acme Corp');
        expect(result.current.niche).toBe('Manufacturing');
        expect(result.current.generatedModules).toEqual(mockClientDetail.client.modules);
        expect(result.current.step).toBe('review');
    });

    it('should reset form state', () => {
        const { result } = renderHook(() => useAdminState());

        act(() => {
            result.current.setUrl('https://example.com');
        });

        expect(result.current.url).toBe('https://example.com');

        act(() => {
            result.current.resetForm();
        });

        expect(result.current.url).toBe('');
        expect(result.current.step).toBe('input');
        expect(result.current.clientName).toBe('');
        expect(result.current.generatedModules).toEqual([]);
    });

    it('should update a module field by index', async () => {
        const { result } = renderHook(() => useAdminState());

        // Load a page to get modules
        await act(async () => {
            await result.current.loadPageForEditing('acme-corp');
        });

        expect(result.current.generatedModules).toHaveLength(1);

        act(() => {
            result.current.updateModule(0, 'headline', 'Updated Headline');
        });

        expect(result.current.generatedModules[0].headline).toBe('Updated Headline');
    });

    it('should not delete without confirmation', () => {
        jest.spyOn(window, 'confirm').mockReturnValue(false);

        const { result } = renderHook(() => useAdminState());

        act(() => {
            result.current.handleDeletePage('acme-corp');
        });

        // fetch should not be called for DELETE since confirm returned false
        const deleteCalls = (global.fetch as jest.Mock).mock.calls.filter(
            ([, opts]: [string, any]) => opts?.method === 'DELETE'
        );
        expect(deleteCalls).toHaveLength(0);
    });
});
