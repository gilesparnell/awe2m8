import React from 'react';
import { Sparkles, Edit } from 'lucide-react';

interface ModeSelectorProps {
    mode: 'create' | 'edit';
    onModeChange: (mode: 'create' | 'edit') => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onModeChange }) => {
    return (
        <div className="flex gap-4 mb-8">
            <button
                onClick={() => onModeChange('create')}
                className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${mode === 'create'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
            >
                <Sparkles className="w-5 h-5" />
                Create New Page
            </button>
            <button
                onClick={() => onModeChange('edit')}
                className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${mode === 'edit'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
            >
                <Edit className="w-5 h-5" />
                Edit Existing Page
            </button>
        </div>
    );
};
