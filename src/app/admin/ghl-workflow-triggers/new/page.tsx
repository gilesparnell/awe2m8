'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { TriggerEditor } from '@/components/admin/ghl/TriggerEditor';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

// Simple slugify function
function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export default function NewTriggerPage() {
    const router = useRouter();
    const [globalError, setGlobalError] = useState('');

    // Debug: Log auth state on load
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log('🔐 Auth State:', {
                isAuthenticated: !!user,
                uid: user?.uid,
                email: user?.email,
                timestamp: new Date().toISOString()
            });
        });
        return unsubscribe;
    }, []);

    const handleSave = async (data: { name: string; description: string; code: string }) => {
        setGlobalError('');

        console.log('📝 Save attempt:', {
            name: data.name,
            user: auth.currentUser?.email,
            timestamp: new Date().toISOString()
        });

        // Generate ID from name
        const id = slugify(data.name);

        if (!id) {
            throw new Error('Name must contain valid characters');
        }

        // Check for duplicate
        try {
            console.log('🔍 Checking for duplicate:', id);
            const existingDoc = await getDoc(doc(db, 'ghl_triggers', id));
            if (existingDoc.exists()) {
                throw new Error('A trigger with this name already exists. Please choose a different name.');
            }
            console.log('✅ No duplicate found');
        } catch (err: any) {
            if (err.message.includes('already exists')) {
                throw err;
            }
            console.error('❌ Duplicate check error:', err.message);
            // If it's a different error, still proceed
        }

        // Save to Firestore
        try {
            console.log('💾 Saving to Firestore:', { id, name: data.name });
            await setDoc(doc(db, 'ghl_triggers', id), {
                id,
                name: data.name,
                description: data.description,
                code: data.code,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });

            console.log('🎉 Save successful!');
            // Redirect to list
            router.push('/admin/ghl-workflow-triggers');
        } catch (err: any) {
            console.error('❌ Save failed:', {
                code: err.code,
                message: err.message,
                customData: err.customData,
                fullError: err
            });
            throw new Error(err.message || 'Failed to save trigger');
        }
    };

    return (
        <TriggerEditor
            onSave={handleSave}
            isEditing={false}
        />
    );
}
