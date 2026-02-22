# 🎯 QUEST: Mission Control Cost Fix + Squad Showcase
**Duration:** 3 hours (while Gilo sleeps)
**Goal:** Get Mission Control working with real costs and beautiful squad showcase
**Status:** CRITICAL - Blocking all development

## PHASE 1: Cost Tracking Fix (90 minutes)
**Priority:** HIGHEST - Must complete first

### Task 1.1: Update Activity Logger (20 min)
**File:** `/src/lib/activity-logger.ts`
- [ ] Add `cost?: number` to ActivityData interface
- [ ] Update all logging functions to accept cost parameter
- [ ] Ensure cost is passed to Firestore

### Task 1.2: Fix Agent Spawner (30 min)
**File:** `/src/lib/agents/spawner.ts`
- [ ] Modify spawnAgent to log actual costs on completion
- [ ] Add cost tracking to activity logs
- [ ] Update completion callback with real cost

### Task 1.3: Update Tool Usage (25 min)
**Files:** Multiple
- [ ] Web search logging with costs
- [ ] Command execution with costs
- [ ] File operations with costs

### Task 1.4: Test Cost Accuracy (15 min)
- [ ] Spawn test agent → Verify non-zero cost in Firestore
- [ ] Run web search → Check cost appears in activity
- [ ] Verify daily budget tracking works

## PHASE 2: Squad Showcase Page (75 minutes)
**Priority:** HIGH - New feature requested

### Task 2.1: Create Squad Showcase Component (30 min)
**File:** `/src/app/admin/mission-control/settings/squad/page.tsx`
- [ ] Beautiful grid layout for 10 agents
- [ ] Agent avatar placeholders
- [ ] Core function display
- [ ] Edit SOUL button for each agent

### Task 2.2: Add Agent Data (15 min)
**File:** `/src/data/agents.ts` (create if needed)
- [ ] Agent avatars (use Lucide icons for now)
- [ ] Core functions for each agent
- [ ] Color schemes per agent

### Task 2.3: Link to Settings Navigation (10 min)
**File:** `/src/app/admin/mission-control/settings/page.tsx`
- [ ] Add "Squad Showcase" to settings menu
- [ ] Update navigation structure

### Task 2.4: Style & Polish (20 min)
- [ ] Make it beautiful (match awe2m8 design)
- [ ] Responsive design
- [ ] Hover effects and animations

## PHASE 3: Testing & Validation (15 minutes)

### Quick Smoke Tests:
- [ ] Load Mission Control → Costs show real values
- [ ] Create task → Cost appears in activity feed
- [ ] Navigate to Settings → Squad → See all 10 agents
- [ ] Click edit on agent → Opens SOUL editor
- [ ] Mobile responsive check

## SUCCESS CRITERIA
✅ All costs show real values (not $0.00)
✅ Squad showcase page loads with all 10 agents
✅ Edit SOUL links work correctly
✅ Mobile responsive
✅ No console errors

## EMERGENCY CONTACT
If blocked or issues arise:
1. Document the exact error
2. Note what you were trying to do
3. Move to next available task
4. Gilo will review in morning

## DELIVERABLES
1. **Fixed cost tracking** - Activities show real costs
2. **Squad showcase page** - Beautiful agent gallery
3. **Updated implementation plan** - Reflects current status
4. **Test results** - Proof it all works

---

**Remember:** 
- Cost fix is CRITICAL - nothing else matters if costs are broken
- Test as you go - don't wait until the end
- Beautiful UI is important - match awe2m8 design standards
- Document any issues for morning review

**Go make it happen!** 🚀