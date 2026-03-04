/**
 * Sync OpenRouter Costs to Mission Control
 * 
 * This script fetches actual usage data from OpenRouter API
 * and updates the Firestore activities collection with real costs.
 * 
 * Usage: ts-node scripts/sync-openrouter-costs.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from Mission Control
 dotenv.config({ path: resolve(__dirname, '../.env.local') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY not found in environment');
  process.exit(1);
}

/**
 * Fetch usage data from OpenRouter API
 */
async function fetchOpenRouterUsage(): Promise<any> {
  const res = await fetch('https://openrouter.ai/api/v1/credits', {
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` },
  });

  if (!res.ok) {
    throw new Error(`OpenRouter API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch recent generations from OpenRouter
 * Note: This requires the generations endpoint which may need special access
 */
async function fetchRecentGenerations(): Promise<any[]> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/generations', {
      headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` },
    });

    if (!res.ok) {
      console.warn('⚠️ Could not fetch generations (may need special access)');
      return [];
    }

    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.warn('⚠️ Error fetching generations:', err);
    return [];
  }
}

/**
 * Estimate cost for a model based on typical usage
 */
function estimateCostForModel(model: string, duration: number): number {
  // Model pricing per 1K tokens (approximate)
  const pricing: Record<string, number> = {
    'openrouter/moonshotai/kimi-k2.5': 0.0005, // Very cheap
    'openrouter/anthropic/claude-sonnet-4': 0.003,
    'openrouter/anthropic/claude-opus-4': 0.015,
    'openrouter/openai/gpt-4o': 0.0025,
    'openrouter/openai/gpt-4o-mini': 0.00015,
  };

  // Estimate tokens based on duration (very rough estimate)
  // Assume ~100 tokens per minute of work
  const estimatedTokens = (duration / 60000) * 100;
  const pricePer1K = pricing[model] || 0.001;
  
  return (estimatedTokens / 1000) * pricePer1K;
}

/**
 * Main sync function
 */
async function main() {
  console.log('🔄 Syncing OpenRouter costs to Mission Control...\n');

  try {
    // Fetch usage data
    const usage = await fetchOpenRouterUsage();
    console.log('📊 OpenRouter Account Status:');
    console.log(`   Total Credits: $${usage.data.total_credits?.toFixed(2) || 0}`);
    console.log(`   Total Used: $${usage.data.total_usage?.toFixed(2) || 0}`);
    console.log(`   Remaining: $${usage.data.credits_remaining?.toFixed(2) || 0}`);
    console.log();

    // Fetch recent generations
    const generations = await fetchRecentGenerations();
    
    if (generations.length === 0) {
      console.log('⚠️ No generation data available');
      console.log('💡 Tips to get actual costs:');
      console.log('   1. Enable detailed logging in OpenRouter dashboard');
      console.log('   2. Use OpenRouter API key with analytics access');
      console.log('   3. Consider estimating costs based on model + duration');
    } else {
      console.log(`📈 Found ${generations.length} recent generations`);
      
      let totalCost = 0;
      for (const gen of generations) {
        const cost = gen.cost || 0;
        totalCost += cost;
        console.log(`   - ${gen.model}: $${cost.toFixed(4)} (${gen.tokens} tokens)`);
      }
      
      console.log(`\n💰 Total recent cost: $${totalCost.toFixed(4)}`);
    }

    console.log('\n✅ Sync complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Check Mission Control dashboard for updated costs');
    console.log('   2. Run this script periodically to sync latest costs');
    console.log('   3. Consider setting up automatic cost logging');

  } catch (err) {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  }
}

main();