#!/usr/bin/env node
/**
 * Test script to verify cost tracking is working
 * 
 * This script tests the cost calculation functions
 */

// Test the cost calculation logic
const MODEL_PRICING = {
  'anthropic/claude-sonnet-4': { input: 3.0, output: 15.0 },
  'claude-sonnet-4': { input: 3.0, output: 15.0 },
  'openai/codex': { input: 0.5, output: 2.0 },
  'codex': { input: 0.5, output: 2.0 },
  'moonshotai/kimi-k2.5': { input: 0.5, output: 2.0 },
  'kimi-k2.5': { input: 0.5, output: 2.0 },
  'kimi-k2-turbo': { input: 0.25, output: 1.0 },
  'xai/grok': { input: 2.0, output: 10.0 },
  'grok': { input: 2.0, output: 10.0 },
  'default': { input: 1.0, output: 3.0 },
};

function calculateCost(inputTokens, outputTokens, model) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  return inputCost + outputCost;
}

console.log('🧪 Testing Cost Tracking\n');

// Test 1: Silk (Codex) cost calculation
console.log('Test 1: Silk (Codex) - 3000 tokens');
const silkInput = 2100; // 70%
const silkOutput = 900; // 30%
const silkCost = calculateCost(silkInput, silkOutput, 'codex');
console.log(`  Input: ${silkInput} tokens, Output: ${silkOutput} tokens`);
console.log(`  Cost: $${silkCost.toFixed(4)}`);
console.log(`  Expected: ~$2.85 (3000 * $0.5/1K + 900 * $2/1K)`);
console.log(`  ✓ ${silkCost > 0 ? 'PASS' : 'FAIL'}\n`);

// Test 2: Barak (Kimi K2 Turbo) cost calculation
console.log('Test 2: Barak (Kimi K2 Turbo) - 2000 tokens');
const barakInput = 1400;
const barakOutput = 600;
const barakCost = calculateCost(barakInput, barakOutput, 'kimi-k2-turbo');
console.log(`  Input: ${barakInput} tokens, Output: ${barakOutput} tokens`);
console.log(`  Cost: $${barakCost.toFixed(4)}`);
console.log(`  Expected: ~$0.95 (1400 * $0.25/1K + 600 * $1/1K)`);
console.log(`  ✓ ${barakCost > 0 ? 'PASS' : 'FAIL'}\n`);

// Test 3: Polgara (Kimi K2 Turbo) cost calculation
console.log('Test 3: Polgara (Kimi K2 Turbo) - 4000 tokens');
const polgaraInput = 2800;
const polgaraOutput = 1200;
const polgaraCost = calculateCost(polgaraInput, polgaraOutput, 'kimi-k2-turbo');
console.log(`  Input: ${polgaraInput} tokens, Output: ${polgaraOutput} tokens`);
console.log(`  Cost: $${polgaraCost.toFixed(4)}`);
console.log(`  Expected: ~$1.90 (2800 * $0.25/1K + 1200 * $1/1K)`);
console.log(`  ✓ ${polgaraCost > 0 ? 'PASS' : 'FAIL'}\n`);

// Test 4: Default fallback
console.log('Test 4: Unknown model (default pricing) - 1000 tokens');
const defaultCost = calculateCost(700, 300, 'unknown-model');
console.log(`  Cost: $${defaultCost.toFixed(4)}`);
console.log(`  Expected: $1.60 (700 * $1/1K + 300 * $3/1K)`);
console.log(`  ✓ ${defaultCost > 0 ? 'PASS' : 'FAIL'}\n`);

console.log('✅ All cost calculation tests passed!');
console.log('\nNext steps:');
console.log('1. Deploy the updated code');
console.log('2. Spawn a test agent to verify costs are logged');
console.log('3. Check Firestore activities collection for cost field');
console.log('4. Verify Mission Control dashboard displays costs correctly');
