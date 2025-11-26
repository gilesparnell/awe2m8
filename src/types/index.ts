export type ModuleType = 'hero' | 'voice_ai' | 'sms_agent' | 'chat_bot' | 'why_it_matters' | 'video';

export interface ModuleData {
    id: string;
    type: ModuleType;
    title?: string;
    content?: string; // Markdown or HTML supported
    config?: Record<string, any>; // Flexible config for iframe URLs, video IDs, etc.
}

export interface ClientPageData {
    id: string; // URL slug (e.g. 'bobs-burgers')
    clientName: string;
    niche: string;
    theme?: 'dark' | 'light'; // Future proofing
    modules: ModuleData[];
    createdAt: number;
}
