
import { formatTrigger, formatClient } from '@/lib/format';

describe('formatTrigger', () => {
    const baseTrigger = {
        id: 'test-trigger',
        name: 'Test Trigger',
        code: '<div>hello</div>',
        description: 'A trigger',
        createdBy: 'admin@test.com',
        createdAt: new Date('2026-03-15T10:00:00Z'),
        updatedAt: new Date('2026-03-16T12:00:00Z'),
    };

    it('should convert dates to epoch milliseconds', () => {
        const result = formatTrigger(baseTrigger);

        expect(result.createdAt).toBe(new Date('2026-03-15T10:00:00Z').getTime());
        expect(result.updatedAt).toBe(new Date('2026-03-16T12:00:00Z').getTime());
    });

    it('should preserve all fields', () => {
        const result = formatTrigger(baseTrigger);

        expect(result.id).toBe('test-trigger');
        expect(result.name).toBe('Test Trigger');
        expect(result.code).toBe('<div>hello</div>');
        expect(result.description).toBe('A trigger');
        expect(result.createdBy).toBe('admin@test.com');
    });

    it('should handle null description and createdBy', () => {
        const result = formatTrigger({ ...baseTrigger, description: null, createdBy: null });

        expect(result.description).toBeNull();
        expect(result.createdBy).toBeNull();
    });
});

describe('formatClient', () => {
    const baseClient = {
        id: 'acme-corp',
        clientName: 'Acme Corp',
        niche: 'Manufacturing',
        modules: [{ id: 'hero', type: 'hero' }],
        createdAt: new Date('2026-02-01T08:00:00Z'),
        updatedAt: new Date('2026-02-02T09:00:00Z'),
    };

    it('should convert createdAt to epoch milliseconds', () => {
        const result = formatClient(baseClient);

        expect(result.createdAt).toBe(new Date('2026-02-01T08:00:00Z').getTime());
    });

    it('should preserve all fields', () => {
        const result = formatClient(baseClient);

        expect(result.id).toBe('acme-corp');
        expect(result.clientName).toBe('Acme Corp');
        expect(result.niche).toBe('Manufacturing');
        expect(result.modules).toEqual([{ id: 'hero', type: 'hero' }]);
    });

    it('should handle empty modules array', () => {
        const result = formatClient({ ...baseClient, modules: [] });

        expect(result.modules).toEqual([]);
    });
});
