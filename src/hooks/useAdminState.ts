import { useState, useEffect } from 'react';
import { ModuleType } from '@/types';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const useAdminState = () => {
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'input' | 'selection' | 'review' | 'preview'>('input');

    // For editing existing pages
    const [existingPages, setExistingPages] = useState<any[]>([]);
    const [selectedPageId, setSelectedPageId] = useState('');

    // Analysis Data
    const [clientName, setClientName] = useState('');
    const [niche, setNiche] = useState('');

    // Available modules
    const [selectedModules, setSelectedModules] = useState<ModuleType[]>([
        'hero', 'voice_ai', 'sms_agent', 'chat_bot', 'why_it_matters'
    ]);
    const [customInstructions, setCustomInstructions] = useState('');

    // Generated Content
    const [generatedModules, setGeneratedModules] = useState<any[]>([]);
    const [generatedPageId, setGeneratedPageId] = useState('');

    // Load existing pages for edit mode
    useEffect(() => {
        let unsubscribe: () => void;

        if (mode === 'edit') {
            setLoading(true);
            // Wait for auth to initialize before fetching
            unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    loadExistingPages();
                } else {
                    // If no user, we can't fetch. The AuthProvider handles the sign-in.
                    // We just wait. Potentially add a timeout/error if it takes too long.
                    console.log('Waiting for Firebase Auth...');
                }
            });
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [mode]);

    const loadExistingPages = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'clients'));
            const pages = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setExistingPages(pages);
        } catch (err: any) {
            console.error('Failed to load pages:', err);
            setError(`Failed to load pages: ${err.message || 'Unknown error'}`);
        }
    };

    const loadPageForEditing = async (pageId: string) => {
        setLoading(true);
        try {
            const docRef = doc(db, 'clients', pageId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setClientName(data.clientName);
                setNiche(data.niche);
                setGeneratedModules(data.modules);
                setGeneratedPageId(pageId);
                setStep('review');
            }
        } catch (err) {
            setError('Failed to load page for editing');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!res.ok) throw new Error('Analysis failed');

            const data = await res.json();
            setClientName(data.clientName);
            setNiche(data.niche);

            if (data.recommendedModules) {
                const recommended = new Set(['hero', 'why_it_matters', ...data.recommendedModules]);
                setSelectedModules(Array.from(recommended) as ModuleType[]);
            }

            setStep('selection');
        } catch (err) {
            setError('Failed to analyze website. Please check the URL and try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName,
                    niche,
                    url,
                    modules: selectedModules,
                    instructions: customInstructions
                })
            });

            if (!res.ok) throw new Error('Generation failed');

            const data = await res.json();
            setGeneratedModules(data.modules);
            setStep('review');
        } catch (err) {
            setError('Failed to generate content. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const pageId = generatedPageId || clientName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            setGeneratedPageId(pageId);

            await setDoc(doc(db, 'clients', pageId), {
                id: pageId,
                clientName,
                niche,
                modules: generatedModules,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });

            setStep('preview');
        } catch (err) {
            setError('Failed to save page.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateModule = (index: number, field: string, value: string) => {
        const newModules = [...generatedModules];
        newModules[index] = { ...newModules[index], [field]: value };
        setGeneratedModules(newModules);
    };

    const updateModuleConfig = (index: number, configKey: string, value: string) => {
        const newModules = [...generatedModules];
        newModules[index] = {
            ...newModules[index],
            config: { ...newModules[index].config, [configKey]: value }
        };
        setGeneratedModules(newModules);
    };

    const resetForm = () => {
        setStep('input');
        setUrl('');
        setClientName('');
        setNiche('');
        setSelectedModules(['hero', 'voice_ai', 'sms_agent', 'chat_bot', 'why_it_matters']);
        setCustomInstructions('');
        setGeneratedModules([]);
        setGeneratedPageId('');
        setSelectedPageId('');
        setError('');
    };

    const handleModeChange = (newMode: 'create' | 'edit') => {
        setMode(newMode);
        resetForm();
    };

    const handleDeletePage = async (pageId: string) => {
        if (!pageId) return;

        if (!window.confirm('Are you sure you want to delete this page? This cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            await deleteDoc(doc(db, 'clients', pageId));
            // Reload pages list
            await loadExistingPages();
            setSelectedPageId('');
        } catch (err) {
            setError('Failed to delete page.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return {
        // State
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

        // Setters
        setUrl,
        setSelectedPageId,
        setCustomInstructions,
        setSelectedModules,

        // Actions
        handleModeChange,
        loadPageForEditing,
        handleDeletePage,
        handleAnalyze,
        handleGenerate,
        handleSave,
        updateModule,
        updateModuleConfig,
        resetForm
    };
};
