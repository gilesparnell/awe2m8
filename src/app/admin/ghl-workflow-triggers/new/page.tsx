'use client';

import React, { useState } from 'react';
import { TriggerEditor } from '@/components/admin/ghl/TriggerEditor';
import { useRouter } from 'next/navigation';

export default function NewTriggerPage() {
    const router = useRouter();

    const handleSave = async (data: { name: string; description: string; code: string }) => {
        const res = await fetch('/api/ghl-triggers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await res.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to create trigger');
        }

        router.push('/admin/ghl-workflow-triggers');
    };

    return (
        <TriggerEditor
            onSave={handleSave}
            isEditing={false}
        />
    );
}
