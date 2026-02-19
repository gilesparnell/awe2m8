'use client';

import React, { useState } from 'react';
import { Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface TriggerEditorProps {
    initialData?: {
        name: string;
        description: string;
        code: string;
    };
    loading?: boolean;
    onSave: (data: { name: string; description: string; code: string }) => Promise<void>;
    isEditing?: boolean;
}

export const TriggerEditor: React.FC<TriggerEditorProps> = ({
    initialData,
    loading = false,
    onSave,
    isEditing = false
}) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [code, setCode] = useState(initialData?.code || '');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const validateForm = (): boolean => {
        setError('');

        if (!name.trim()) {
            setError('Name is required');
            return false;
        }

        if (name.trim().length < 3) {
            setError('Name must be at least 3 characters');
            return false;
        }

        if (name.trim().length > 100) {
            setError('Name must be 100 characters or less');
            return false;
        }

        if (!code.trim()) {
            setError('Code is required');
            return false;
        }

        if (code.trim().length < 10) {
            setError('Code must be at least 10 characters');
            return false;
        }

        if (description.length > 500) {
            setError('Description must be 500 characters or less');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        try {
            await onSave({
                name: name.trim(),
                description: description.trim(),
                code: code.trim()
            });
        } catch (err: any) {
            setError(err.message || 'Failed to save trigger');
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
            <div className="max-w-2xl mx-auto">
                <Link href="/admin/ghl-workflow-triggers" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-8">
                    <ChevronLeft className="w-4 h-4" />
                    Back to Triggers
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {isEditing ? 'Edit Trigger' : 'Create New Trigger'}
                    </h1>
                    <p className="text-gray-400">
                        {isEditing
                            ? 'Modify your webhook trigger code.'
                            : 'Create a new custom webhook page for GHL workflows.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Alert */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            Trigger Name <span className="text-orange-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Lead Capture Webhook"
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors"
                            maxLength={100}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {name.length}/100 characters
                        </p>
                    </div>

                    {/* Description Field */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional notes about this trigger..."
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-gray-300 focus:border-orange-500 outline-none transition-colors h-20 resize-none"
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {description.length}/500 characters
                        </p>
                    </div>

                    {/* Code Field */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            HTML/CSS/JavaScript Code <span className="text-orange-400">*</span>
                        </label>
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Paste your HTML, CSS, and JavaScript code here..."
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-gray-300 focus:border-orange-500 outline-none transition-colors h-64 font-mono text-sm resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {code.length} characters
                        </p>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-6">
                        <Link
                            href="/admin/ghl-workflow-triggers"
                            className="px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-900 transition-colors font-bold text-gray-300"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving || loading}
                            className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                `${isEditing ? 'Update' : 'Create'} Trigger`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
