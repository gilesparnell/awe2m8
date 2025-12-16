'use client';

import { useSession } from 'next-auth/react';
import { SignOutButton } from './SignOutButton';

export function UserAvatar() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-800 rounded-full animate-pulse" />
        <div className="w-20 h-4 bg-gray-800 rounded animate-pulse" />
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            className="w-8 h-8 rounded-full border border-gray-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {session.user.name?.[0] || session.user.email?.[0] || '?'}
          </div>
        )}
        <span className="text-gray-300 text-sm hidden sm:block">
          {session.user.name || session.user.email}
        </span>
      </div>
      <SignOutButton showIcon={false} />
    </div>
  );
}
