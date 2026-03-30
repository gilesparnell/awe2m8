import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { formatTrigger } from '@/lib/format';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const trigger = await prisma.ghlTrigger.findUnique({ where: { id } });

        if (!trigger) {
            return NextResponse.json(
                { success: false, error: 'Trigger not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            trigger: formatTrigger(trigger),
        });
    } catch (error) {
        console.error('Failed to fetch trigger:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch trigger' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();
        const { name, description, code } = body;

        const trigger = await prisma.ghlTrigger.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description: description || null }),
                ...(code !== undefined && { code }),
            },
        });

        return NextResponse.json({
            success: true,
            trigger: formatTrigger(trigger),
        });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return NextResponse.json(
                { success: false, error: 'Trigger not found' },
                { status: 404 }
            );
        }
        console.error('Failed to update trigger:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update trigger' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        await prisma.ghlTrigger.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return NextResponse.json(
                { success: false, error: 'Trigger not found' },
                { status: 404 }
            );
        }
        console.error('Failed to delete trigger:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete trigger' },
            { status: 500 }
        );
    }
}
