
import React from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <AdminHeader />
            <main>
                {children}
            </main>
        </div>
    );
}
