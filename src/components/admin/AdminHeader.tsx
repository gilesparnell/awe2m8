import React from 'react';
import { BookOpen } from 'lucide-react';

export const AdminHeader: React.FC = () => {
    return (
        <header className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-800 rounded-full text-green-400 text-xs font-bold uppercase tracking-wider mb-4">
                Internal Tool
            </div>
            <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 tracking-tight">
                AWE2M8 - Internal Tools
            </h1>
            <p className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">
                Create personalized AI demo pages for prospects in minutes. Our AI analyzes their website and generates custom sales content.
            </p>
        </header>
    );
};

export const InstructionsPanel: React.FC = () => {
    return (
        <div className="bg-blue-900/10 border border-blue-800/30 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                    <h3 className="text-blue-300 font-bold mb-2">How to Use This Tool</h3>
                    <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
                        <li><strong className="text-white">Enter URL:</strong> Paste the prospect's website URL and click "Analyze"</li>
                        <li><strong className="text-white">Select Modules:</strong> Choose which AI solutions to showcase (Voice AI, SMS, Chat, etc.)</li>
                        <li><strong className="text-white">Generate Content:</strong> Our AI writes personalized sales copy based on their business</li>
                        <li><strong className="text-white">Review & Edit:</strong> Fine-tune the content and add demo links</li>
                        <li><strong className="text-white">Publish:</strong> Save and share the live demo page with your prospect</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};
