import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { formatClient } from '@/lib/format';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const client = await prisma.client.findUnique({ where: { id } });

        if (!client) {
            return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, client: formatClient(client) });
    } catch (error) {
        console.error('Failed to fetch client:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch client' }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        await prisma.client.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete client:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete client' }, { status: 500 });
    }
}
