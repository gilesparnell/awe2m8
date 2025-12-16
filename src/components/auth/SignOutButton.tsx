'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

interface SignOutButtonProps {
  className?: string;
  showIcon?: boolean;
}

export function SignOutButton({ className = '', showIcon = true }: SignOutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className={`flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer ${className}`}
    >
      {showIcon && <LogOut className="w-4 h-4" />}
      <span>Sign Out</span>
    </button>
  );
}
