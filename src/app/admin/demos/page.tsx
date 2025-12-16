'use client';

import React from 'react';
import Link from 'next/link';
import { ModuleType } from '@/types';
import { useAdminState } from '@/hooks/useAdminState';
import { AdminHeader } from '@/components/admin/AdminHeader';
// InstructionsPanel removed as it's not exported
import { ModeSelector } from '@/components/admin/ModeSelector';
import { PageSelector } from '@/components/admin/PageSelector';
import { URLInput } from '@/components/admin/URLInput';
import { ModuleSelector } from '@/components/admin/ModuleSelector';
import { ContentEditor } from '@/components/admin/ContentEditor';
import { SuccessScreen } from '@/components/admin/SuccessScreen';
import { ErrorAlert } from '@/components/admin/ErrorAlert';

export default function AdminPage() {
    const {
        mode,
        url,
        loading,
        error,
        step,
        existingPages,
        selectedPageId,
        clientName,
        niche,
        selectedModules,
        customInstructions,
        generatedModules,
        generatedPageId,
        setUrl,
        setSelectedPageId,
        setCustomInstructions,
        setSelectedModules,
        handleModeChange,
        loadPageForEditing,
        handleDeletePage,
        handleAnalyze,
        handleGenerate,
        handleSave,
        updateModule,
        updateModuleConfig,
        resetForm
    } = useAdminState();

    const handleModuleToggle = (module: ModuleType, checked: boolean) => {
        if (checked) {
            setSelectedModules([...selectedModules, module]);
        } else {
            setSelectedModules(selectedModules.filter(m => m !== module));
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto">

                <div className="mb-6">
                    <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                        Back to Tools
                    </Link>
                </div>


                <ModeSelector mode={mode} onModeChange={handleModeChange} />

                <ErrorAlert message={error} />

                {/* Edit Mode: Page Selector */}
                {mode === 'edit' && step === 'input' && (
                    <PageSelector
                        pages={existingPages}
                        selectedPageId={selectedPageId}
                        loading={loading}
                        onSelectPage={setSelectedPageId}
                        onLoadPage={() => loadPageForEditing(selectedPageId)}
                        onDeletePage={handleDeletePage}
                    />
                )}

                {/* Create Mode: URL Input */}
                {mode === 'create' && step === 'input' && (
                    <URLInput
                        url={url}
                        loading={loading}
                        onUrlChange={setUrl}
                        onAnalyze={handleAnalyze}
                    />
                )}

                {/* Step 2: Module Selection */}
                {step === 'selection' && (
                    <ModuleSelector
                        clientName={clientName}
                        niche={niche}
                        selectedModules={selectedModules}
                        customInstructions={customInstructions}
                        loading={loading}
                        onModuleToggle={handleModuleToggle}
                        onInstructionsChange={setCustomInstructions}
                        onGenerate={handleGenerate}
                    />
                )}

                {/* Step 3: Review & Edit */}
                {step === 'review' && (
                    <ContentEditor
                        mode={mode}
                        modules={generatedModules}
                        loading={loading}
                        onUpdateModule={updateModule}
                        onUpdateModuleConfig={updateModuleConfig}
                        onCancel={mode === 'create' ? () => handleModeChange('create') : resetForm}
                        onSave={handleSave}
                    />
                )}

                {/* Step 4: Success */}
                {step === 'preview' && (
                    <SuccessScreen
                        mode={mode}
                        pageId={generatedPageId}
                        onReset={resetForm}
                    />
                )}
            </div>
        </div>
    );
}
