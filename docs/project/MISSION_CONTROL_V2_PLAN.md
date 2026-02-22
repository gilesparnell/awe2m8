# Mission Control v2 — Implementation Plan (Revised)

**Date:** 2026-02-20 (16:00 AEDT)  
**Revised by:** Garion (Opus 4.6)  
**Status:** Awaiting Gilo's review  
**Approach:** Option A — Beautiful Dashboard  
**Location:** `/Users/gilesparnell/Documents/VSStudio/awe2m8-local/src/app/admin/mission-control/`

---

## Philosophy

Ship two focused deliverables, not a 6-phase roadmap. Previous plans were too ambitious and got lost when memory/agents failed. This plan is:
- **File-by-file specific** — no ambiguity about what to create
- **Independently committable** — each step can be shipped alone
- **Built on existing foundation** — refactor, don't rebuild

---

## Current State (What Exists)

### ✅ Good Foundation
- **Data model:** Area → UserStory → Task with TypeScript types (`/src/types/investigation.ts`)
- **Firestore hooks:** `useInvestigations`, `useUserStories`, `useTasks`, `useConsiderations` — all with real-time subscriptions
- **Components:** InvestigationBoard, InvestigationArea, UserStoryCard, NavigationTabs, CreateTaskModal
- **Layout:** Dark theme (`bg-gray-950`), green accents, Lucide icons, rounded cards
- **Stack:** Next.js 15, React 19, Tailwind v4, Firebase

### ❌ Problems to Fix
- **Monolithic page.tsx** — 550+ lines mixing 5 components in one file
- **Dual systems** — `useAgents` hook (with hardcoded defaults) AND `useInvestigations` (proper Firestore) not unified
- **No cost tracking** — `cost` field exists on Tasks but isn't aggregated or displayed
- **No Settings page** — previous attempt was separate deployment, not integrated
- **Agent cards too large** — take up too much screen space for the info they provide

---

## Deliverable 1: Dashboard Cleanup & Beautification

### Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `src/components/mission-control/DashboardHeader.tsx` | Title, subtitle, nav tabs, cost summary pill |
| 2 | `src/components/mission-control/StatsBar.tsx` | Stat cards with cost tracking, color-coded budgets |
| 3 | `src/components/mission-control/AgentRow.tsx` | Horizontal compact agent strip (replaces 3-column cards) |
| 4 | `src/components/mission-control/TaskDetailSlideOver.tsx` | Slide-over panel (replaces full-screen modal) |
| 5 | `src/components/mission-control/ActivityTimeline.tsx` | Timeline grouped by time (Today/Yesterday/Earlier) |
| 6 | `src/components/mission-control/QuickActions.tsx` | Floating action buttons |
| 7 | `src/hooks/useCostTracking.ts` | Aggregates task costs by date/agent/week |

### Files to Modify

| # | File | Changes |
|---|------|---------|
| 1 | `src/app/admin/mission-control/page.tsx` | Gut monolith → import components. Target <100 lines |
| 2 | `src/types/investigation.ts` | Add `estimatedCost`, `actualCost` to Area and UserStory |

### Backend/Data Changes

| # | What | Where |
|---|------|-------|
| 1 | Cost fields on Areas | Firestore `areas_of_investigation` — `estimatedCost`, `actualCost` |
| 2 | Cost fields on Stories | Firestore `user_stories` — `estimatedCost`, `actualCost` |
| 3 | Budget config | Firestore `config/budget` or hardcoded: daily=$50, weekly=$250 |

### Visual Design Changes

- **Agent row:** Horizontal strip, compact. Status dots. Click to expand.
- **Investigation board:** Keep (it's good). Add cost badges per area.
- **Activity feed:** Timeline with time grouping, not flat list.
- **Stats bar:** Cost tracking prominent. Color-coded budgets.
- **Typography:** Tighter spacing, less border noise, better hierarchy.

---

## Deliverable 2: Settings Page

### Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `src/app/admin/mission-control/settings/page.tsx` | Settings page with file sections |
| 2 | `src/components/mission-control/settings/FileCard.tsx` | Rich card per file: icon, name, description, priority |
| 3 | `src/components/mission-control/settings/FileEditorModal.tsx` | Modal: markdown viewer + editor + save |
| 4 | `src/components/mission-control/settings/SectionHeader.tsx` | Section dividers with icons |
| 5 | `src/app/api/workspace/files/route.ts` | API: read/write workspace .md files |
| 6 | `src/hooks/useWorkspaceFile.ts` | Hook for file fetch/update via API |

### Files to Modify

| # | File | Changes |
|---|------|---------|
| 1 | `src/components/NavigationTabs.tsx` | Add "Settings" tab |

### File Sections (Priority Order)

**🧠 Identity & Purpose**
- SOUL.md — Garion's personality, role, behavior rules (🔴 Critical)
- USER.md — Who Gilo is (🔴 Critical)
- IDENTITY.md — Name, emoji, creature type (🟡 Important)

**🎯 Strategy & Goals**
- GOALS.md — Business goals, financial targets (🔴 Critical)
- WORKING.md — Current active priorities (🔴 Critical)
- QUEST.md — Night ops quest log (🟡 Important)

**⚙️ Operations**
- AGENTS.md — Workspace rules, memory protocol (🔴 Critical)
- TOOLS.md — Local environment notes (🟡 Important)
- HEARTBEAT.md — Periodic check config (🟢 Standard)

**📝 Memory & History**
- MEMORY.md — Long-term curated memories (🔴 Critical)
- memory/YYYY-MM-DD.md — Daily logs (🟡 Important)
- MISSION_CONTROL_V2_PLAN.md — This plan (🟢 Standard)

**🤖 Agent SOULs**
- Individual agent SOUL files (🟡 Important)

### Backend

| # | API Route | Method | Purpose |
|---|-----------|--------|---------|
| 1 | `/api/workspace/files?path=SOUL.md` | GET | Read file content + metadata |
| 2 | `/api/workspace/files` | PUT | Write content, optionally git commit |
| 3 | `/api/workspace/files/list` | GET | List all .md files with metadata |

---

## Execution Order

```
Step 1: Create HTML mockups for review           ← CURRENT
Step 2: Gilo reviews, provides design feedback
Step 3: Refactor page.tsx into components         ← Dashboard cleanup
Step 4: Add cost tracking hook + type changes
Step 5: Build Settings page + API routes
Step 6: Navigation integration
Step 7: Deploy to Vercel, test on mobile
```

Each step is independent and committable.

---

## What We're NOT Building (Yet)

Parked for future phases:
- Calendar view
- Memory browser
- Global search / Command palette (Cmd+K)
- Workflow engine
- Next steps AI
- Team performance dashboard

These come AFTER Dashboard + Settings are shipped and verified.

---

*Committed to memory: 2026-02-20 16:00 AEDT*
*Awaiting Gilo's review before execution*
