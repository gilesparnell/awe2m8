'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { GHLTriggerPage } from '@/types';
import { ChevronLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function ViewTriggerPage() {
    const params = useParams();
    const id = params.id as string;

    const [trigger, setTrigger] = useState<GHLTriggerPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTrigger = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'ghl_triggers', id));
                if (docSnap.exists()) {
                    setTrigger(docSnap.data() as GHLTriggerPage);
                    setLoading(false);
                } else {
                    setError('Trigger not found');
                    setLoading(false);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load trigger');
                setLoading(false);
            }
        };

        fetchTrigger();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 text-white p-8 flex items-center justify-center font-sans">
                <div className="animate-spin">
                    <div className="w-8 h-8 border-4 border-gray-700 border-t-orange-500 rounded-full"></div>
                </div>
            </div>
        );
    }

    if (error || !trigger) {
        return (
            <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
                <Link href="/admin/ghl-workflow-triggers" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
                    <ChevronLeft className="w-4 h-4" />
                    Back to Triggers
                </Link>
                <div className="text-center mt-12">
                    <p className="text-red-400">{error || 'Trigger not found'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-950 text-white font-sans flex flex-col overflow-hidden">
            {/* Compact Header */}
            <div className="border-b border-gray-800 px-4 py-2 bg-gray-900/50 flex items-center justify-between flex-shrink-0">
                <Link href="/admin/ghl-workflow-triggers" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                    Back to Triggers
                </Link>
                <div className="text-right">
                    <h1 className="text-sm font-bold text-white">{trigger.name}</h1>
                    {trigger.description && (
                        <p className="text-xs text-gray-500">{trigger.description}</p>
                    )}
                </div>
            </div>

            {/* Iframe - Takes up remaining space */}
            <div className="flex-1 overflow-hidden w-full">
                <iframe
                    srcDoc={trigger.code}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
                    allow="microphone; camera; autoplay; encrypted-media; fullscreen; clipboard-read; clipboard-write"
                />
            </div>
        </div>
    );
}
