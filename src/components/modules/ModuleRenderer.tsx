import React from 'react';
import { ModuleData } from '@/types';
import { HeroBlock } from './HeroBlock';
import { VoiceAIBlock } from './VoiceAIBlock';
import { SMSBlock } from './SMSBlock';
import { ChatBlock } from './ChatBlock';
import { WhyItMattersBlock } from './WhyItMattersBlock';

export const ModuleRenderer: React.FC<{ module: ModuleData }> = ({ module }) => {
    const renderModule = () => {
        switch (module.type) {
            case 'hero':
                return <HeroBlock data={module} />;
            case 'voice_ai':
                return <VoiceAIBlock data={module} />;
            case 'sms_agent':
                return <SMSBlock data={module} />;
            case 'chat_bot':
                return <ChatBlock data={module} />;
            case 'why_it_matters':
                return <WhyItMattersBlock data={module} />;
            default:
                console.warn(`Unknown module type: ${module.type}`);
                return null;
        }
    };

    return (
        <section id={module.type}>
            {renderModule()}
        </section>
    );
};
