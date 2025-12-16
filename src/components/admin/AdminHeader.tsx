
import React from 'react';
import Link from 'next/link';
import { UserAvatar } from '@/components/auth/UserAvatar';

export function AdminHeader() {
    return (
        <header className="sticky top-0 z-50 w-full bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left: Logo/Home Link */}
                    <div className="flex-shrink-0">
                        <Link href="/admin" className="flex items-center gap-2 group">
                            <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-green-400 transition-colors">
                                AWE2M8 <span className="text-green-500">Admin</span>
                            </span>
                        </Link>
                    </div>

                    {/* Right: User Menu */}
                    <div className="flex items-center gap-4">
                        <UserAvatar />
                    </div>
                </div>
            </div>
        </header>
    );
}
