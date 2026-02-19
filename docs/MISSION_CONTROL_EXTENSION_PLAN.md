# Mission Control Extension Plan
## Based on Alex Finn's Requirements

**Date:** 2026-02-18  
**Source:** https://x.com/AlexFinn/status/2019816560190521563  
**Status:** Planning Phase

---

## Current State Assessment

### ✅ What's Already Built
1. **Activity Feed Page** (`/admin/mission-control/activity`)
   - Shows activities from Firestore
   - Has filtering by actor (Garion, Fury, Friday, Loki)
   - Stats cards showing counts
   - **LIMITATION:** Only captures task creation, not EVERY action

2. **Calendar Page** (`/admin/mission-control/calendar`)
   - Basic calendar component exists
   - Has day/month/week view modes
   - **LIMITATION:** Not connected to actual task deadlines

3. **Global Search**
   - **DOES NOT EXIST** - needs to be built

### 🔴 What's Missing (The Gap)
- Activity feed doesn't capture: file reads/writes, web searches, tool executions, agent spawns
- Calendar doesn't show actual task deadlines from Firestore
- No search across: memory files, documents, tasks, activities

---

## Build Plan (Iterative)

### Phase 1: Enhanced Activity Tracking ⏳ NEXT
**Goal:** Capture EVERYTHING I do in real-time

**Implementation:**
1. Create activity logging utility that wraps all my tool calls
2. Modify my core functions to log to Firestore:
   - `read` → log file access
   - `write`/`edit` → log file changes  
   - `web_search`/`web_fetch` → log web activity
   - `exec` → log command execution
   - `sessions_spawn` → log agent spawning
3. Add activity creation to task creation flow (already done)
4. Test: Every action I take appears in the activity feed

**Files to Create/Modify:**
- `src/lib/activity-logger.ts` (NEW)
- Modify existing hooks to use logger
- Update ActivityFeed component if needed

**Testing:**
- Create a task → should see activity
- Read a file → should see activity
- Search web → should see activity

---

### Phase 2: Calendar Weekly View with Task Deadlines ⏳
**Goal:** Show scheduled tasks in a weekly view

**Implementation:**
1. Add `dueDate` field to tasks schema
2. Modify CalendarView to show weekly view by default
3. Connect to Firestore to fetch tasks with deadlines
4. Display tasks as events on calendar
5. Allow drag-and-drop to reschedule

**Files to Create/Modify:**
- Update `src/types/calendar.ts`
- Update `src/hooks/useCalendar.ts`
- Update `src/components/CalendarView.tsx`
- Update task creation to include due date

**Testing:**
- Create task with deadline → appears on calendar
- Move task on calendar → updates deadline
- Weekly view shows 7 days properly

---

### Phase 3: Global Search ⏳
**Goal:** Search across all workspace data

**Implementation:**
1. Create search index/API that queries:
   - Firestore: tasks, activities
   - File system: memory/*.md, docs/
2. Build search UI with filters (by type, date, agent)
3. Show results with context snippets
4. Click result → navigate to item

**Files to Create:**
- `src/app/api/search/route.ts` (NEW)
- `src/components/GlobalSearch.tsx` (NEW)
- `src/hooks/useSearch.ts` (NEW)
- Add search button to Mission Control header

**Testing:**
- Search "task" → finds tasks
- Search "Jesse" → finds mentions in memory
- Search "Twilio" → finds docs and activities

---

## Memory Update Strategy

After each phase:
1. Update `WORKING.md` with what's complete
2. Update this plan with status
3. Note any blockers or issues

If laptop restarts, read:
1. This plan file
2. `WORKING.md`
3. Current phase's todo

---

## Technical Decisions

- **Database:** Using Firestore (already set up), not Convex
- **Framework:** Next.js (already set up)
- **Location:** `/Users/gilesparnell/Documents/VSStudio/awe2m8-local`
- **Approach:** Client-side Firestore queries (avoid index issues)

---

## Current Blockers

None. Ready to start Phase 1.

**Next Action:** Build activity logging utility
