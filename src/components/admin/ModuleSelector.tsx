import React from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { ModuleType } from '@/types';

interface ModuleSelectorProps {
    clientName: string;
    niche: string;
    selectedModules: ModuleType[];
    customInstructions: string;
    loading: boolean;
    onModuleToggle: (module: ModuleType, checked: boolean) => void;
    onInstructionsChange: (instructions: string) => void;
    onGenerate: () => void;
}

export const ModuleSelector: React.FC<ModuleSelectorProps> = ({
    clientName,
    niche,
    selectedModules,
    customInstructions,
    loading,
    onModuleToggle,
    onInstructionsChange,
    onGenerate
}) => {
    const modules: ModuleType[] = ['hero', 'voice_ai', 'sms_agent', 'chat_bot', 'why_it_matters'];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Recommended Modules</h2>
                <p className="text-gray-400">
                    Identified: <span className="text-white font-bold">{clientName}</span> ({niche})
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((mod) => (
                    <label
                        key={mod}
                        className={`group flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${selectedModules.includes(mod)
                                ? 'bg-green-900/10 border-green-500/50 shadow-lg shadow-green-900/10'
                                : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                            }`}
                    >
                        <div
                            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${selectedModules.includes(mod)
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-gray-600 bg-gray-800 group-hover:border-gray-500'
                                }`}
                        >
                            {selectedModules.includes(mod) && <Check className="w-4 h-4 text-black" />}
                        </div>
                        <input
                            type="checkbox"
                            checked={selectedModules.includes(mod)}
                            onChange={(e) => onModuleToggle(mod, e.target.checked)}
                            className="hidden"
                        />
                        <span className="capitalize font-bold text-lg">{mod.replace('_', ' ')}</span>
                    </label>
                ))}
            </div>

            {/* Custom Instructions */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">
                    Custom AI Instructions (Optional)
                </label>
                <p className="text-gray-500 text-sm mb-3 leading-relaxed">
                    Guide the AI's tone, style, and focus. Examples: "Make it more casual and friendly," "Emphasize cost savings and ROI," "Mention that we're better than [competitor]," or "Use sports metaphors."
                </p>
                <textarea
                    value={customInstructions}
                    onChange={(e) => onInstructionsChange(e.target.value)}
                    placeholder="e.g., Focus on time savings for busy gym owners, use an energetic tone, mention 24/7 availability prominently..."
                    className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all h-24 resize-none"
                />
            </div>

            <div className="flex justify-center pt-8">
                <button
                    onClick={onGenerate}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-xl px-12 py-5 rounded-full font-bold shadow-xl shadow-green-900/30 transition-all hover:scale-105 flex items-center gap-3"
                >
                    {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                    Generate Content
                </button>
            </div>
        </div>
    );
};
