import React from 'react';
import { Check, Globe, ArrowRight } from 'lucide-react';

interface SuccessScreenProps {
    mode: 'create' | 'edit';
    pageId: string;
    onReset: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ mode, pageId, onReset }) => {
    const liveUrl = `https://demos.awe2m8.ai/${pageId}`;

    return (
        <div className="text-center space-y-8 animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400 border border-green-500/30">
                <Check className="w-12 h-12" />
            </div>
            <div>
                <h2 className="text-4xl font-bold text-white mb-2">
                    {mode === 'edit' ? 'Page Updated!' : 'Page Published!'}
                </h2>
                <p className="text-gray-400 text-lg">Your demo page is now live and ready to share.</p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 max-w-md mx-auto border border-gray-800">
                <p className="text-sm text-gray-500 mb-2 uppercase font-bold">Live Demo URL</p>
                <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-green-400 font-mono bg-black p-3 rounded-lg hover:text-green-300 transition-colors text-sm break-all"
                >
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    demos.awe2m8.ai/{pageId}
                </a>
            </div>

            <div className="flex justify-center gap-4 pt-4">
                <button
                    onClick={onReset}
                    className="px-8 py-4 rounded-xl border border-gray-700 hover:bg-gray-800 transition-all font-bold text-gray-300"
                >
                    Create Another
                </button>
                <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-10 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 shadow-lg shadow-white/10"
                >
                    View Live Page <ArrowRight className="w-5 h-5" />
                </a>
            </div>
        </div>
    );
};
