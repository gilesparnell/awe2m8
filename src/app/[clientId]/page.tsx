import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ModuleRenderer } from '@/components/modules/ModuleRenderer';
import { DemoNavigation } from '@/components/DemoNavigation';
import { Metadata } from 'next';

interface PageData {
    id: string;
    clientName: string;
    niche: string;
    modules: any[];
}

export async function generateMetadata({ params }: { params: Promise<{ clientId: string }> }): Promise<Metadata> {
    const { clientId } = await params;

    const docRef = doc(db, 'clients', clientId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return {
            title: 'Demo Not Found | AWE2M8',
        };
    }

    const data = docSnap.data() as PageData;

    return {
        title: `${data.clientName} - AI Solutions Demo | AWE2M8`,
        description: `Personalized AI automation demo for ${data.clientName}. See how Voice AI, SMS agents, and chatbots can transform your ${data.niche} business.`,
    };
}

export default async function ClientPage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = await params;

    // Fetch page data from Firestore
    const docRef = doc(db, 'clients', clientId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        notFound();
    }

    const data = docSnap.data() as PageData;

    return (
        <main className="min-h-screen bg-stone-50 text-slate-900">
            <DemoNavigation modules={data.modules} />

            {data.modules.map((module) => (
                <ModuleRenderer key={module.id} module={module} />
            ))}

            <footer className="py-16 text-center text-gray-400 text-xs uppercase tracking-wider border-t border-stone-200 bg-stone-50">
                Powered by AWE2M8
            </footer>
        </main>
    );
}
