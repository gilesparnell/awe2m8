import React from 'react';
import { Loader2, Edit, Trash2 } from 'lucide-react';

interface PageSelectorProps {
    pages: any[];
    selectedPageId: string;
    loading: boolean;
    onSelectPage: (pageId: string) => void;
    onLoadPage: () => void;
    onDeletePage: (pageId: string) => void;
}

export const PageSelector: React.FC<PageSelectorProps> = ({
    pages,
    selectedPageId,
    loading,
    onSelectPage,
    onLoadPage,
    onDeletePage
}) => {
    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-10 max-w-2xl mx-auto backdrop-blur-sm shadow-2xl">
            <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">
                Select Page to Edit
            </label>
            <select
                value={selectedPageId}
                onChange={(e) => onSelectPage(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-xl py-4 px-4 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all mb-4"
            >
                <option value="">-- Select a page --</option>
                {pages.map(page => (
                    <option key={page.id} value={page.id}>
                        {page.clientName} ({page.id})
                    </option>
                ))}
            </select>

            <div className="flex gap-4">
                <button
                    onClick={onLoadPage}
                    disabled={!selectedPageId || loading}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Edit className="w-5 h-5" />}
                    Load Page
                </button>

                <button
                    onClick={() => onDeletePage(selectedPageId)}
                    disabled={!selectedPageId || loading}
                    className="bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete Page"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
