import React from 'react';
import { ModuleRenderer } from '@/components/modules/ModuleRenderer';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ClientPageData } from '@/types';

export default async function ClientPage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = await params;

    // Fetch data from Firestore
    // Note: In a real production app, you might want to use 'cache' or 'revalidate' options
    // but for this dynamic sales tool, fetching fresh data is better.
    let data: ClientPageData | null = null;

    try {
        const docRef = doc(db, 'clients', clientId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            data = docSnap.data() as ClientPageData;
        }
    } catch (error) {
        console.error("Error fetching client page:", error);
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-4xl font-bold text-red-500 mb-4">Client Not Found</h1>
                <p className="text-gray-400">The page <code className="text-green-400">/{clientId}</code> does not exist.</p>
                <p className="text-gray-500 mt-4 text-sm">If you just created it, give it a moment to propagate.</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-stone-50 text-slate-900">
            {data.modules.map((module) => (
                <ModuleRenderer key={module.id} module={module} />
            ))}

            <footer className="py-16 text-center text-gray-400 text-xs uppercase tracking-wider border-t border-stone-200 bg-stone-50">
                Powered by AWE2M8
            </footer>
        </main>
    );
}
