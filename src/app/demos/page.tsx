'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ModuleType } from '@/types';
import { useAdminState } from '@/hooks/useAdminState';
import { AdminHeader, InstructionsPanel } from '@/components/admin/AdminHeader';
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
                <AdminHeader />

                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Tools
                    </Link>
                </div>

                <InstructionsPanel />

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
