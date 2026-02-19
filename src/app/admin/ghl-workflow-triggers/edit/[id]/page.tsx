'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { GHLTriggerPage } from '@/types';
import { TriggerEditor } from '@/components/admin/ghl/TriggerEditor';
import { useRouter, useParams } from 'next/navigation';

export default function EditTriggerPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [trigger, setTrigger] = useState<GHLTriggerPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [globalError, setGlobalError] = useState('');

    useEffect(() => {
        const fetchTrigger = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'ghl_triggers', id));
                if (docSnap.exists()) {
                    setTrigger(docSnap.data() as GHLTriggerPage);
                    setLoading(false);
                } else {
                    setGlobalError('Trigger not found');
                    setLoading(false);
                }
            } catch (err: any) {
                setGlobalError(err.message || 'Failed to load trigger');
                setLoading(false);
            }
        };

        fetchTrigger();
    }, [id]);

    const handleSave = async (data: { name: string; description: string; code: string }) => {
        setGlobalError('');

        try {
            await updateDoc(doc(db, 'ghl_triggers', id), {
                name: data.name,
                description: data.description,
                code: data.code,
                updatedAt: Date.now()
            });

            router.push('/admin/ghl-workflow-triggers');
        } catch (err: any) {
            throw new Error(err.message || 'Failed to update trigger');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 text-white p-8 flex items-center justify-center font-sans">
                <div className="animate-spin">
                    <div className="w-8 h-8 border-4 border-gray-700 border-t-orange-500 rounded-full"></div>
                </div>
            </div>
        );
    }

    if (!trigger || globalError) {
        return (
            <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
                        <p className="text-red-400">{globalError || 'Trigger not found'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <TriggerEditor
            initialData={{
                name: trigger.name,
                description: trigger.description || '',
                code: trigger.code
            }}
            onSave={handleSave}
            isEditing={true}
        />
    );
}
