'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    const [showTriggeredConfirmation, setShowTriggeredConfirmation] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

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

    useEffect(() => {
        const iframeEl = iframeRef.current;
        if (!iframeEl) return;

        let iframeDoc: Document | null = null;

        const triggerConfirmation = () => {
            setShowTriggeredConfirmation(true);
        };

        const handleSubmit = () => {
            triggerConfirmation();
        };

        const handleClick = (event: Event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const submitControl = target.closest(
                'button[type="submit"], input[type="submit"], input[type="button"], button'
            ) as HTMLElement | null;
            if (!submitControl) return;

            const text = (submitControl.textContent || '').toLowerCase().trim();
            const value = ((submitControl as HTMLInputElement).value || '').toLowerCase().trim();
            const label = `${text} ${value}`;

            if (label.includes('submit') || label.includes('trigger')) {
                triggerConfirmation();
            }
        };

        const attachListeners = () => {
            try {
                iframeDoc = iframeEl.contentDocument;
                if (!iframeDoc) return;

                iframeDoc.addEventListener('submit', handleSubmit, true);
                iframeDoc.addEventListener('click', handleClick, true);
            } catch {
                // Ignore cross-origin/content access issues.
            }
        };

        iframeEl.addEventListener('load', attachListeners);
        attachListeners();

        return () => {
            iframeEl.removeEventListener('load', attachListeners);
            if (iframeDoc) {
                iframeDoc.removeEventListener('submit', handleSubmit, true);
                iframeDoc.removeEventListener('click', handleClick, true);
            }
        };
    }, [trigger]);

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
                    ref={iframeRef}
                    srcDoc={trigger.code}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
                    allow="microphone; camera; autoplay; encrypted-media; fullscreen; clipboard-read; clipboard-write"
                />
            </div>

            {showTriggeredConfirmation && (
                <div className="fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] max-w-md rounded-xl border border-green-500/40 bg-gray-900/95 p-4 shadow-2xl shadow-black/60">
                    <p className="text-green-300 font-semibold text-sm">GHL workflow triggered successfully.</p>
                    <p className="text-gray-300 text-xs mt-1">
                        The submit action was detected. You can return to the trigger list now.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                        <Link
                            href="/admin/ghl-workflow-triggers"
                            className="inline-flex items-center rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-gray-950 hover:bg-green-400 transition-colors"
                        >
                            Back to Triggers
                        </Link>
                        <button
                            type="button"
                            onClick={() => setShowTriggeredConfirmation(false)}
                            className="inline-flex items-center rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
