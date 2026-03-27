# Mission Control Integration Plan

## Current State
- Mission Control has 10 agents: All mystical clan members
- Basic task management and activity tracking
- ❌ Cost tracking shows $0.00 for everything (BROKEN)
- Settings page exists at `/admin/mission-control/settings`

## CRITICAL FIX REQUIRED: Phase 0 - Cost Tracking
**Status: BROKEN - All costs show $0.00**

The cost tracking system exists but doesn't capture actual costs. Activities are logged without cost information. This MUST be fixed before any other features.

**See:** `COST_TRACKING_FIX_PLAN.md` for detailed implementation

### Quick Fix Summary:
1. Update activity logger to accept cost parameters
2. Modify agent spawner to log actual costs when tasks complete
3. Update all tool usage (web search, commands) to include costs
4. Test cost accuracy before proceeding

## Integration Goals
1. ✅ Add all 8 mystical clan agents to the UI (COMPLETE)
2. ❌ Fix cost tracking to show real costs (CRITICAL)
3. Update settings to include new documentation
4. Integrate shared workspace files
5. Add troubleshooting and health monitoring

## Phase 1: Agent Expansion

### 1. Update Agent Definitions
**File:** `/src/hooks/useAgents.ts`

Add new agents to DEFAULT_AGENTS:
- Ce'Nedra (UX/Strategy) - Purple
- Taiba (Analytics) - Indigo  
- Beldin (QA/Oversight) - Red
- Relg (Growth/Marketing) - Orange
- Durnik (Operations) - Brown
- Errand (Training/Feedback) - Cyan
- Mandorallen (Security) - Silver

### 2. Update Agent Icons
Map each agent to appropriate Lucide icons:
- Barak: Target (keep)
- Silk: Bot (keep)
- Polgara: FileText (keep)
- Ce'Nedra: Palette or Sparkles
- Taiba: BarChart3
- Beldin: ShieldAlert or Eye
- Relg: TrendingUp
- Durnik: Wrench or Settings
- Errand: GraduationCap
- Mandorallen: Shield or Lock

### 3. Update Agent Roles
Add descriptive roles for each agent's specialty.

## Phase 2: Settings Page Updates

### 1. Documentation Section
**File:** `/src/app/admin/mission-control/settings/page.tsx`

Add new settings tabs:
- "Team Documentation" - Links to all .md files
- "Troubleshooting" - Quick access to health checks
- "Performance" - Metrics and monitoring

### 2. Create Documentation Viewer Component
New component to display markdown files from `/shared/` directory:
- Handoff Protocol
- Troubleshooting Guide
- Health Status
- Spawn Cheatsheet

## Phase 3: Shared Workspace Integration

### 1. Task File Integration
Update task creation to:
- Write to `/shared/tasks/{uuid}.md`
- Include proper task format
- Link to output files

### 2. Output File Reading
Add ability to:
- Read from `/shared/outputs/{uuid}.md`
- Display agent outputs in UI
- Track deliverables

### 3. Intel Dashboard
New section showing:
- Daily intelligence summaries
- Performance metrics
- Team coordination status

## Phase 4: Health Monitoring

### 1. Health Check Component
Display real-time:
- Agent success rates
- Cost tracking
- System status
- Warning indicators

### 2. Troubleshooting Integration
Quick actions for:
- Killing stuck agents
- Running diagnostics
- Viewing logs

## Implementation Steps

### PRIORITY 0: Fix Cost Tracking (CRITICAL)
**Must complete before any other steps**
1. Update activity logger to accept cost parameters
2. Modify agent spawner to log actual costs
3. Update all tool usage to include costs
4. Test that real costs appear in UI

### Step 1: Update Agent Definitions (COMPLETE)
✅ All 10 mystical clan agents added to DEFAULT_AGENTS
✅ Icons and colors updated
✅ Agent rendering tested

### Step 2: Settings Update (45 min)
1. Add documentation tabs
2. Create markdown viewer component
3. Link to shared files

### Step 3: Workspace Integration (60 min)
1. Update task creation flow
2. Add output file reading
3. Create intel dashboard

### Step 4: Health Monitoring (45 min)
1. Create health check component
2. Add troubleshooting actions
3. Integrate performance metrics

## End-to-End Testing Plan (Updated)

### Phase 0 Testing (CRITICAL - Must Pass First)
1. **Cost Accuracy Test:**
   - Spawn any agent (e.g., Barak for research)
   - Verify activity shows non-zero cost in Firestore
   - Check Mission Control displays real cost (not $0.00)
   - Validate daily budget tracking works
   - Test budget exceeded warnings

2. **Tool Cost Tracking:**
   - Execute web search → Check cost is logged
   - Run command → Check cost is logged  
   - Create task → Check cost is logged
   - Complete task → Check final cost is accurate

### Phase 1-4 Testing (After Cost Fix)
3. Verify all 10 agents display correctly
4. Test documentation loading
5. Check file read/write operations
6. Validate health monitoring
7. Test workspace integration

## Deliverables (Updated)
1. ✅ Updated useAgents.ts with all agents (COMPLETE)
2. ❌ **FIXED** Cost tracking system showing real costs (PHASE 0)
3. Enhanced settings page (Phase 2)
4. Documentation viewer component (Phase 2)
5. Workspace integration hooks (Phase 3)
6. Health monitoring dashboard (Phase 4)
7. Updated UI with new agent icons/colors (COMPLETE)

## Next Steps - BLOCKED
**🚨 CRITICAL PATH BLOCKED 🚨**

**Issue:** Cost tracking is fundamentally broken - shows $0.00 for everything

**Cannot proceed to Phase 1 until Phase 0 is complete and verified**

**Immediate Action Required:**
1. Execute `COST_TRACKING_FIX_PLAN.md` Phase 0 immediately
2. Deploy cost fix to production
3. Verify with test agent spawn that costs appear in UI
4. Validate budget alerts work
5. Get sign-off that cost tracking is functional

**Risk:** Without working cost tracking, Gilo cannot manage API spend. This is blocking all other development.

**Status:** 🔴 BLOCKED - Phase 0 cost fix required before any other work