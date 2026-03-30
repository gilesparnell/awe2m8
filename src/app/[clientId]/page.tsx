import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ModuleRenderer } from '@/components/modules/ModuleRenderer';
import { DemoNavigation } from '@/components/DemoNavigation';
import { Metadata } from 'next';
import { ModuleData } from '@/types';

export async function generateMetadata({ params }: { params: Promise<{ clientId: string }> }): Promise<Metadata> {
    const { clientId } = await params;

    const client = await prisma.client.findUnique({ where: { id: clientId } });

    if (!client) {
        return {
            title: 'Demo Not Found | Parnell Systems',
        };
    }

    return {
        title: `${client.clientName} - AI Solutions Demo | Parnell Systems`,
        description: `Personalized AI automation demo for ${client.clientName}. See how Voice AI, SMS agents, and chatbots can transform your ${client.niche} business.`,
    };
}

export default async function ClientPage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = await params;

    const client = await prisma.client.findUnique({ where: { id: clientId } });

    if (!client) {
        notFound();
    }

    const modules = client.modules as unknown as ModuleData[];

    return (
        <main className="min-h-screen bg-stone-50 text-slate-900">
            <DemoNavigation modules={modules} />

            {modules.map((module) => (
                <ModuleRenderer key={module.id} module={module} />
            ))}

            <footer className="py-16 text-center text-gray-400 text-xs uppercase tracking-wider border-t border-stone-200 bg-stone-50">
                Powered by Parnell Systems
            </footer>
        </main>
    );
}
