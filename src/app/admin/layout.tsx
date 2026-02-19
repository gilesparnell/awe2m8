'use client';

import React from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useFirebaseAuth(); // Authenticate with Firebase

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <AdminHeader />
            <main>
                {children}
            </main>
        </div>
    );
}
