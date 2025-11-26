import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        // 1. Scrape the Website
        // Note: In a real production app, you might need a proxy service to avoid blocking.
        // For local dev/MVP, a direct fetch often works for simple sites.
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract meaningful text (title, meta description, h1, p)
        const title = $('title').text();
        const description = $('meta[name="description"]').attr('content') || '';
        const h1 = $('h1').first().text();
        const paragraphs = $('p').map((_, el) => $(el).text()).get().slice(0, 5).join(' '); // First 5 paragraphs

        const context = `
      Title: ${title}
      Description: ${description}
      Header: ${h1}
      Content: ${paragraphs}
    `.substring(0, 2000); // Limit context size

        // 2. Analyze with AI
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert AI Automation Consultant. Analyze the business website content provided. Identify the business name, their industry/niche, and recommend 3-4 AI automation modules that would help them. Available modules: 'voice_ai' (Phone answering), 'sms_agent' (Text updates/marketing), 'chat_bot' (Website support), 'why_it_matters' (Benefits). Return JSON."
                },
                {
                    role: "user",
                    content: `Analyze this business:\n${context}\n\nReturn JSON format: { "clientName": string, "niche": string, "recommendedModules": ["voice_ai", "sms_agent", ...] }`
                }
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const analysis = JSON.parse(completion.choices[0].message.content || '{}');

        return NextResponse.json(analysis);

    } catch (error) {
        console.error('Analysis Error:', error);
        return NextResponse.json({ error: 'Failed to analyze website' }, { status: 500 });
    }
}
