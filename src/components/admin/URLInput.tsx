import React from 'react';
import { Loader2, Sparkles, Globe } from 'lucide-react';

interface URLInputProps {
    url: string;
    loading: boolean;
    onUrlChange: (url: string) => void;
    onAnalyze: () => void;
}

export const URLInput: React.FC<URLInputProps> = ({ url, loading, onUrlChange, onAnalyze }) => {
    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-10 max-w-2xl mx-auto backdrop-blur-sm shadow-2xl">
            <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">
                Client Website URL
            </label>
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => onUrlChange(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full bg-black border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    />
                </div>
                <button
                    onClick={onAnalyze}
                    disabled={!url || loading}
                    className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    Analyze
                </button>
            </div>
            <p className="text-gray-500 text-sm mt-4">
                The AI will scrape this site to understand their business model, tone, and pain points.
            </p>
        </div>
    );
};
