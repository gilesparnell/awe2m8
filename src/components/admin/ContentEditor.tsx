import React from 'react';
import { Loader2, Check, Wand2 } from 'lucide-react';

interface ContentEditorProps {
    mode: 'create' | 'edit';
    modules: any[];
    loading: boolean;
    onUpdateModule: (index: number, field: string, value: string) => void;
    onUpdateModuleConfig: (index: number, configKey: string, value: string) => void;
    onCancel: () => void;
    onSave: () => void;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
    mode,
    modules,
    loading,
    onUpdateModule,
    onUpdateModuleConfig,
    onCancel,
    onSave
}) => {

    // Smart Paste Logic
    const handleSmartPaste = (input: string): string => {
        const cleanInput = input.trim();

        // 1. Try to find Assistant ID from script tag (data-assistant-id="...")
        // Allow for spaces around = and different quote types
        const idMatch = cleanInput.match(/data-assistant-id\s*=\s*["']([^"']+)["']/);
        if (idMatch && idMatch[1]) {
            return `https://iframes.ai/o/${idMatch[1]}?color=&icon=`;
        }

        // 2. Try to find src from iframe tag (src="...")
        // Allow for spaces around =
        const srcMatch = cleanInput.match(/src\s*=\s*["']([^"']+)["']/);
        if (srcMatch && srcMatch[1]) {
            const url = srcMatch[1];
            // Only use the src if it looks like an iframe URL (not a JS script)
            // This prevents grabbing the wrong src from a script tag if ID match failed
            if (url.includes('iframes.ai') || url.includes('retell')) {
                return url;
            }
        }

        // 3. If it looks like a raw ID (alphanumeric, >15 chars), construct URL
        if (/^[a-zA-Z0-9]+$/.test(cleanInput) && cleanInput.length > 15 && !cleanInput.includes('http')) {
            return `https://iframes.ai/o/${cleanInput}?color=&icon=`;
        }

        // 4. Fallback: return original input (trimmed)
        return cleanInput;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Review & Edit</h2>
                <p className="text-gray-400">Review the generated content below. Edit anything you like before publishing.</p>
            </div>

            <div className="space-y-6">
                {modules.map((module, idx) => (
                    <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase text-green-400 bg-green-900/20 px-2 py-1 rounded">
                                {module.type.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 uppercase">Title</label>
                                <input
                                    type="text"
                                    value={module.title}
                                    onChange={(e) => onUpdateModule(idx, 'title', e.target.value)}
                                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white font-bold focus:border-green-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 uppercase">Content</label>
                                <textarea
                                    value={module.content}
                                    onChange={(e) => onUpdateModule(idx, 'content', e.target.value)}
                                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-gray-300 focus:border-green-500 outline-none h-32"
                                />
                            </div>

                            {/* URL Configuration for specific module types */}
                            {module.type === 'voice_ai' && (
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1 uppercase flex items-center gap-2">
                                        Voice AI Demo Code <Wand2 className="w-3 h-3 text-purple-400" />
                                    </label>
                                    <textarea
                                        value={module.config?.iframeUrl || ''}
                                        onChange={(e) => {
                                            const smartUrl = handleSmartPaste(e.target.value);
                                            onUpdateModuleConfig(idx, 'iframeUrl', smartUrl);
                                        }}
                                        placeholder="Paste the FULL script tag or iframe code from Assistable here..."
                                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-blue-400 font-mono text-xs focus:border-green-500 outline-none h-24"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        ✨ <strong>Smart Paste:</strong> Paste the entire code block. We'll extract the ID automatically.
                                    </p>
                                </div>
                            )}

                            {module.type === 'sms_agent' && (
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1 uppercase">SMS Demo Link URL</label>
                                    <input
                                        type="url"
                                        value={module.config?.url || ''}
                                        onChange={(e) => onUpdateModuleConfig(idx, 'url', e.target.value)}
                                        placeholder="https://your-sms-demo.com"
                                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-blue-400 font-mono text-sm focus:border-green-500 outline-none"
                                    />
                                </div>
                            )}

                            {module.type === 'chat_bot' && (
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1 uppercase flex items-center gap-2">
                                        Chat Bot Code <Wand2 className="w-3 h-3 text-purple-400" />
                                    </label>
                                    <textarea
                                        value={module.config?.url || ''}
                                        onChange={(e) => {
                                            const smartUrl = handleSmartPaste(e.target.value);
                                            onUpdateModuleConfig(idx, 'url', smartUrl);
                                        }}
                                        placeholder="Paste the FULL script tag or iframe code from Assistable here..."
                                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-blue-400 font-mono text-xs focus:border-green-500 outline-none h-24"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        ✨ <strong>Smart Paste:</strong> Paste the entire code block. We'll extract the ID automatically.
                                    </p>
                                    {module.config?.url === "https://iframes.ai/o/?color=&icon=" && (
                                        <p className="text-red-400 text-xs mt-1 font-bold">
                                            ⚠️ Warning: Missing Agent ID. Please paste the code that includes 'data-assistant-id'.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center gap-4 pt-8 pb-12">
                <button
                    onClick={onCancel}
                    className="px-8 py-4 rounded-xl border border-gray-700 hover:bg-gray-800 transition-all font-bold text-gray-300"
                >
                    {mode === 'create' ? "Don't like this copy? Get AI to try again" : "Cancel"}
                </button>
                <button
                    onClick={onSave}
                    disabled={loading}
                    className="bg-white text-black text-xl px-12 py-5 rounded-full font-bold shadow-xl shadow-white/10 transition-all hover:scale-105 flex items-center gap-3"
                >
                    {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Check className="w-6 h-6" />}
                    {mode === 'edit' ? 'Update & Publish' : 'Save & Publish'}
                </button>
            </div>
        </div>
    );
};
