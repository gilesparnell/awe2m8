import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;

    try {
        const trigger = await prisma.ghlTrigger.findUnique({ where: { id } });

        if (!trigger) {
            return {
                title: 'Not Found | GHL Trigger',
            };
        }

        return {
            title: trigger.name,
            description: trigger.description || 'GHL Workflow Trigger',
            robots: 'noindex, nofollow',
        };
    } catch {
        return {
            title: 'Error | GHL Trigger',
        };
    }
}

export default async function GHLTriggerPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    try {
        const trigger = await prisma.ghlTrigger.findUnique({ where: { id } });

        if (!trigger) {
            notFound();
        }

        return (
            <iframe
                srcDoc={trigger.code}
                className="w-full h-screen border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
                allow="microphone; camera; autoplay; encrypted-media; fullscreen; clipboard-read; clipboard-write"
            />
        );
    } catch {
        notFound();
    }
}
