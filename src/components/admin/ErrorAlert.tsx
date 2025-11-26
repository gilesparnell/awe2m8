import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
    message: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
    if (!message) return null;

    return (
        <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {message}
        </div>
    );
};
