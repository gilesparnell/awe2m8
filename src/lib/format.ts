import type { GhlTrigger, Client } from '@/generated/prisma/client'

export function formatTrigger(t: GhlTrigger) {
    return {
        id: t.id,
        name: t.name,
        code: t.code,
        description: t.description,
        createdAt: t.createdAt.getTime(),
        updatedAt: t.updatedAt.getTime(),
        createdBy: t.createdBy,
    }
}

export function formatClient(c: Client) {
    return {
        id: c.id,
        clientName: c.clientName,
        niche: c.niche,
        modules: c.modules,
        createdAt: c.createdAt.getTime(),
    }
}
