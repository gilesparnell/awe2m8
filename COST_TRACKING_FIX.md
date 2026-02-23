# Cost Tracking Fix - Implementation Summary

## Problem
All costs were showing $0.00 in the Mission Control dashboard because:
1. Activities were logged without cost information
2. Agent tasks had `actualCost` field but it was never populated
3. The cost tracking hook read from Firestore but costs were never written

## Solution
Modified the activity logging system to capture and store real API costs.

## Files Changed

### 1. `src/lib/activity-logger.ts`
**Changes:**
- Added optional `cost` field to `ActivityData` interface
- Added `MODEL_PRICING` constant with pricing for all supported models
- Added `calculateCost(inputTokens, outputTokens, model)` function
- Added cost-aware logging functions:
  - `logAgentSpawnWithCost()` - Log agent spawn with estimated cost
  - `logTaskCompletedWithCost()` - Log task completion with actual cost
  - `logWebSearchWithCost()` - Log web search with cost
- Updated console logging to show cost when available

### 2. `src/lib/agents/spawner-real.ts`
**Changes:**
- Imported new cost tracking functions from activity-logger
- Added `calculateActualCost()` function to compute costs on task completion
- Updated process close handler to:
  - Calculate actual cost
  - Store `actualCost` in agent_tasks document
  - Log task completion with cost to activities collection

### 3. `src/lib/agents/spawner.ts`
**Changes:**
- Added `completeTask()` function for explicit task completion with cost tracking
- Imports `logTaskCompletedWithCost` for logging completions

### 4. `scripts/agent-executor.js`
**Changes:**
- Added token tracking (`sessionTokens` object)
- Added `calculateActualCost()` function
- Added `logActivityWithCost()` function
- Updated all task execution functions to track tokens and log with costs:
  - `executeSilkTask()` - Tracks coding task costs
  - `executeBarakTask()` - Tracks research task costs
  - `executePolgaraTask()` - Tracks content creation costs
- Updated completion handler to calculate and report actual cost

### 5. `src/hooks/useCostTracking.ts`
**Changes:**
- Added `actor` field to Activity interface
- Updated cost aggregation to use `actor` as fallback for `agentId`

## Cost Calculation

Costs are calculated based on:
- **Input tokens** × input price per 1K tokens
- **Output tokens** × output price per 1K tokens

Current pricing (USD per 1K tokens):
| Model | Input | Output |
|-------|-------|--------|
| Claude Sonnet 4 | $3.00 | $15.00 |
| OpenAI Codex | $0.50 | $2.00 |
| Kimi K2.5 | $0.50 | $2.00 |
| Kimi K2 Turbo | $0.25 | $1.00 |
| Grok | $2.00 | $10.00 |
| Default | $1.00 | $3.00 |

## Testing

Run the test script to verify cost calculations:
```bash
node scripts/test-cost-tracking.js
```

## Verification Steps

1. **Deploy the updated code**
   ```bash
   git push origin feat/cost-tracking-fix
   ```

2. **Test agent spawn**
   - Spawn an agent (Silk, Barak, or Polgara)
   - Check Firestore `activities` collection for cost field
   - Check Firestore `agent_tasks` collection for actualCost field

3. **Verify Mission Control dashboard**
   - Costs should now display actual values instead of $0.00
   - Today/Week/Month aggregations should work correctly

## Example Cost Outputs

- Silk (Codex, 3000 tokens): ~$2.85
- Barak (Kimi K2 Turbo, 2000 tokens): ~$0.95
- Polgara (Kimi K2 Turbo, 4000 tokens): ~$1.90

## Future Improvements

1. **Real token tracking**: Currently uses estimates. Integrate with OpenClaw session API to get actual token usage.
2. **Cost alerts**: Add notifications when daily budgets are exceeded.
3. **Cost optimization suggestions**: Analyze expensive operations and suggest cheaper alternatives.
4. **Historical cost analytics**: Track cost trends over time.
