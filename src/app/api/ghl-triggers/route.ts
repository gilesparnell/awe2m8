import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { formatTrigger } from '@/lib/format';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const triggers = await prisma.ghlTrigger.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            triggers: triggers.map(formatTrigger),
        });
    } catch (error) {
        console.error('Failed to fetch triggers:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch triggers' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, description, code } = body;

        if (!name || !code) {
            return NextResponse.json(
                { success: false, error: 'Name and code are required' },
                { status: 400 }
            );
        }

        const id = slugify(name);

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Name must contain valid characters' },
                { status: 400 }
            );
        }

        const existing = await prisma.ghlTrigger.findUnique({ where: { id } });
        if (existing) {
            return NextResponse.json(
                { success: false, error: 'A trigger with this name already exists. Please choose a different name.' },
                { status: 409 }
            );
        }

        const trigger = await prisma.ghlTrigger.create({
            data: { id, name, description: description || null, code },
        });

        return NextResponse.json({
            success: true,
            trigger: formatTrigger(trigger),
        });
    } catch (error) {
        console.error('Failed to create trigger:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create trigger' },
            { status: 500 }
        );
    }
}
