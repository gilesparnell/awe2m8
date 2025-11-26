import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ModuleType } from '@/types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { clientName, niche, modules, url, instructions } = await request.json();

        // Build context about selected modules for Why It Matters
        const selectedUseCases = modules.filter((m: string) => ['voice_ai', 'sms_agent', 'chat_bot'].includes(m));
        const useCaseContext = selectedUseCases.map((m: string) => {
            const names: Record<string, string> = {
                voice_ai: 'Voice AI (24/7 phone answering)',
                sms_agent: 'SMS Agent (text message automation)',
                chat_bot: 'Chat Bot (website support)'
            };
            return names[m] || m;
        }).join(', ');

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a world-class copywriter for AWE2M8, an AI Automation Agency. 
          Generate high-converting content for a client demo page.
          Client: ${clientName} (${niche}).
          Website: ${url}
          Selected Use Cases: ${useCaseContext}
          
          Tone: Professional, Results-Oriented, Data-Driven.
          ${instructions ? `Additional Instructions: ${instructions}` : ''}
          
          For each requested module, generate specific content:
          - hero: Title (catchy, benefit-focused) and Content (compelling subheadline).
          - voice_ai: Title and Content (focus on 24/7 availability, never missing calls).
          - sms_agent: Title and Content (focus on speed, engagement, instant responses).
          - chat_bot: Title and Content (focus on lead capture, instant support).
          - why_it_matters: Title and Content (HTML string with metrics and ROI data).
          
          CRITICAL for "why_it_matters":
          - Generate 3-4 specific, quantifiable metrics that show the ROI of the selected use cases (${useCaseContext}).
          - Format as HTML with <div> tags for each metric.
          - Each metric MUST include:
            1. A <strong> tag with the statistic AND a superscript asterisk (e.g., "<strong>87% increase in lead capture*</strong>")
            2. Explanatory text describing the benefit
            3. A <small> tag at the end with the source citation (e.g., "<small>*Source: Harvard Business Review, 2023</small>")
          - Use credible sources: industry reports, research studies, or reputable publications (e.g., McKinsey, Gartner, HBR, Forrester)
          - Focus on business impact: revenue increase, time saved, customer satisfaction, conversion rates.
          - Make metrics specific to the ${niche} industry when possible.
          - Example format: "<div><strong>3X Faster Response Times*</strong> - Respond to customer inquiries in under 30 seconds, dramatically improving conversion rates. <small>*Source: Salesforce State of Service Report, 2024</small></div>"
          
          Return a JSON object where keys are the module types and values are objects with { title, content }.`
                },
                {
                    role: "user",
                    content: `Generate content for these modules: ${modules.join(', ')}`
                }
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const contentMap = JSON.parse(completion.choices[0].message.content || '{}');

        // Construct the final module array
        const generatedModules = modules.map((type: ModuleType, index: number) => ({
            id: `mod_${index}_${Date.now()}`,
            type,
            title: contentMap[type]?.title || "AI Solution",
            content: contentMap[type]?.content || "Automate your business.",
            config: { url: "#", iframeUrl: "" } // Default placeholders
        }));

        return NextResponse.json({ modules: generatedModules });

    } catch (error) {
        console.error('Generation Error:', error);
        return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }
}
