import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { GHLTriggerPage } from '@/types';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;

    try {
        const docSnap = await getDoc(doc(db, 'ghl_triggers', id));

        if (!docSnap.exists()) {
            return {
                title: 'Not Found | GHL Trigger',
            };
        }

        const data = docSnap.data() as GHLTriggerPage;

        return {
            title: data.name,
            description: data.description || 'GHL Workflow Trigger',
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
        const docSnap = await getDoc(doc(db, 'ghl_triggers', id));

        if (!docSnap.exists()) {
            notFound();
        }

        const data = docSnap.data() as GHLTriggerPage;

        return (
            <iframe
                srcDoc={data.code}
                className="w-full h-screen border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
                allow="microphone; camera; autoplay; encrypted-media; fullscreen; clipboard-read; clipboard-write"
            />
        );
    } catch {
        notFound();
    }
}
