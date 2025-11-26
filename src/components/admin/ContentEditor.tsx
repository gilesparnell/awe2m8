import React from 'react';
import { Loader2, Check } from 'lucide-react';

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
                                    <label className="block text-xs text-gray-500 mb-1 uppercase">Voice AI Demo URL (iframe)</label>
                                    <input
                                        type="url"
                                        value={module.config?.iframeUrl || ''}
                                        onChange={(e) => onUpdateModuleConfig(idx, 'iframeUrl', e.target.value)}
                                        placeholder="https://iframes.ai/o/..."
                                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-blue-400 font-mono text-sm focus:border-green-500 outline-none"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">Paste the iframe src URL from Assistable.ai</p>
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
                                    <label className="block text-xs text-gray-500 mb-1 uppercase">Chat Bot iframe URL</label>
                                    <input
                                        type="url"
                                        value={module.config?.url || ''}
                                        onChange={(e) => onUpdateModuleConfig(idx, 'url', e.target.value)}
                                        placeholder="https://iframes.ai/o/?color=&icon="
                                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-blue-400 font-mono text-sm focus:border-green-500 outline-none"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">Paste the iframe src URL from Assistable.ai</p>
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
