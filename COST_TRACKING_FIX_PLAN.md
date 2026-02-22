# Mission Control Cost Tracking Fix - Implementation Plan

## Problem Statement
The Mission Control dashboard shows $0.00 for all costs because:
1. Activities are being logged without cost information
2. No mechanism exists to attach actual costs to activity records
3. The cost tracking system reads from Firestore activities but costs are never written

## Phase 0: Foundation - Cost Data Flow (CRITICAL)

### Step 1: Update Activity Logger (30 min)
**File:** `/src/lib/activity-logger.ts`

- Add optional `cost` parameter to all logging functions
- Update `ActivityData` interface to include cost field
- Ensure cost is passed through to Firestore

```typescript
export interface ActivityData {
  actor: ActivityActor;
  actorType: 'main' | 'subagent' | 'system';
  category: ActivityCategory;
  action: ActivityAction;
  description: string;
  cost?: number; // ADD THIS
  metadata?: Record<string, unknown>;
  sessionId?: string;
  taskId?: string;
  project?: string;
}
```

### Step 2: Update Agent Spawner (45 min)
**File:** `/src/lib/agents/spawner.ts`

- Modify spawnAgent to track actual costs when tasks complete
- Add cost tracking to the completion callback
- Update activity logs with real costs

```typescript
// When task completes, log with actual cost
await logActivity({
  actor: input.agentId as ActivityActor,
  actorType: 'subagent',
  category: 'agent',
  action: 'complete',
  description: `Completed task: ${input.task}`,
  cost: actualCost, // Track the real cost
  taskId: taskRef.id,
  metadata: {
    agentId: input.agentId,
    estimatedCost,
    actualCost,
    tokensUsed
  }
});
```

### Step 3: Cost Model Integration (60 min)
**Files:** 
- `/src/lib/agents/config.ts` - Add cost calculation helpers
- `/src/hooks/useCostTracking.ts` - Update to handle cost updates

- Create token-to-cost conversion functions for each model
- Update cost tracking to handle real-time cost updates
- Add cost validation and budget checking

### Step 4: Tool Usage Cost Tracking (90 min)
**Update all tool usage to track costs:**

**Web Search Costs** (`activity-logger.ts`):
```typescript
export async function logWebSearch(
  query: string,
  resultCount: number,
  cost: number, // ADD COST PARAMETER
  actor: ActivityActor = 'garion',
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    actor,
    actorType: actor === 'garion' ? 'main' : 'subagent',
    category: 'web',
    action: 'search',
    description: `Searched web: "${query}" (${resultCount} results)`,
    cost, // LOG THE COST
    metadata: { query, resultCount, ...metadata },
  });
}
```

**Command Execution Costs**:
```typescript
export async function logCommandExecution(
  command: string,
  exitCode: number,
  cost: number, // ADD COST PARAMETER
  actor: ActivityActor = 'garion',
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivity({
    actor,
    actorType: actor === 'garion' ? 'main' : 'subagent',
    category: 'tool',
    action: 'run',
    description: `Executed: ${command.split(' ')[0]}`,
    cost, // LOG THE COST
    metadata: { command, exitCode, success: exitCode === 0, ...metadata },
  });
}
```

## Phase 1: Real-Time Cost Updates (45 min)

### Step 1: Update Cost Tracking Hook
**File:** `/src/hooks/useCostTracking.ts`

- Add real-time cost updates using Firebase listeners
- Implement cost aggregation from multiple sources
- Add cost prediction and budget warnings

### Step 2: Budget Alert System (30 min)
**Create new component:** `/src/components/mission-control/BudgetAlerts.tsx`

- Show warnings when agents approach daily budgets
- Display cost trends and predictions
- Alert when costs spike unexpectedly

## Phase 2: Cost Visualization Updates (60 min)

### Step 1: Update StatsBar Component
**File:** `/src/components/mission-control/StatsBar.tsx`

- Ensure real costs are displayed (not $0.00)
- Add cost breakdown by agent
- Show cost trends over time

### Step 2: Agent Cost Details
**Update Agent cards to show:**
- Current task cost
- Daily spend
- Remaining budget
- Cost efficiency metrics

## Phase 3: Testing & Validation (45 min)

### Step 1: Cost Accuracy Tests
- Verify all activities log correct costs
- Test budget enforcement
- Validate cost aggregation

### Step 2: End-to-End Testing
- Spawn agents and verify costs appear
- Check budget alerts trigger correctly
- Ensure costs reset daily

## Implementation Order

1. **Start with Phase 0 Step 1** - Update activity logger (30 min)
2. **Phase 0 Step 2** - Update agent spawner (45 min)
3. **Phase 0 Step 3** - Cost model integration (60 min)
4. **Test basic cost logging** before proceeding
5. **Phase 1** - Real-time updates (45 min)
6. **Phase 2** - Visualization updates (60 min)
7. **Phase 3** - Testing (45 min)

## Success Criteria

- [ ] All activities show non-zero costs in Mission Control
- [ ] Daily agent budgets are enforced
- [ ] Cost breakdown by agent is accurate
- [ ] Budget alerts work correctly
- [ ] Costs reset at midnight
- [ ] Real-time cost updates appear in UI

## Notes

- This MUST be completed before any other Mission Control features
- Cost accuracy is critical for Gilo's budget management
- Test with small amounts first ($0.01-$0.05 per activity)
- Ensure Firestore security rules allow cost updates