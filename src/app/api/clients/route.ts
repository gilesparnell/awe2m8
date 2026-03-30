import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { formatClient } from '@/lib/format';

const RESERVED_SLUGS = ['admin', 'api', 'login', 'ghl-triggers', '_next', 'demos', 'twilio'];
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, clients: clients.map(formatClient) });
    } catch (error) {
        console.error('Failed to fetch clients:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch clients' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, clientName, niche, modules } = body;

        if (!id || !clientName) {
            return NextResponse.json({ success: false, error: 'id and clientName are required' }, { status: 400 });
        }

        if (typeof id !== 'string' || id.length > 50 || !SLUG_PATTERN.test(id)) {
            return NextResponse.json({ success: false, error: 'id must be a valid slug (lowercase alphanumeric and hyphens, 2-50 chars)' }, { status: 400 });
        }

        if (RESERVED_SLUGS.includes(id)) {
            return NextResponse.json({ success: false, error: 'This id is reserved and cannot be used' }, { status: 400 });
        }

        const client = await prisma.client.upsert({
            where: { id },
            create: { id, clientName, niche, modules },
            update: { clientName, niche, modules },
        });

        return NextResponse.json({ success: true, client: formatClient(client) });
    } catch (error) {
        console.error('Failed to upsert client:', error);
        return NextResponse.json({ success: false, error: 'Failed to save client' }, { status: 500 });
    }
}
