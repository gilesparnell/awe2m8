# Mission Control Architecture Redesign Plan
## Comprehensive Task & User Story Management System

**Date:** 2026-02-18  
**Status:** Planning Phase  
**Goal:** Full visibility of user stories, agent work, and real-time progress

---

## 🎯 Gaps Identified in Current System

### Current State:
- ❌ **No UI for task assignment** - Must use chat
- ❌ **Tasks ≠ User Stories** - Wrong granularity
- ❌ **No Areas of Investigation** - Can't break down work
- ❌ **No artifact links** - Can't navigate to code/docs
- ❌ **Static "Areas to Consider"** - Not editable
- ❌ **No real-time work visibility** - Can't see what agent is doing *right now*

### What's Missing:
1. **Hierarchical structure:** Area of Investigation → User Stories → Tasks
2. **UI Task Assignment:** Drag-and-drop or form-based
3. **Live agent status:** What file is being edited right now
4. **Artifact navigation:** Click to open in VS Code
5. **Interactive considerations:** Edit, reprompt, dismiss
6. **Deliverable links:** Direct access to completed work

---

## 🏗️ Proposed Architecture

### Data Model Hierarchy

```
Area of Investigation (Epic)
├── Title: "Research AI Receptionist Competitors"
├── Description: "Deep analysis of market landscape"
├── Assigned Agent: Barak
├── Status: in_progress
└── User Stories
    ├── US-001: "Analyze Dialpad pricing"
    │   ├── Status: done
    │   ├── Tasks
    │   │   ├── T-001: "Scrape pricing page" → /research/dialpad_pricing.md
    │   │   └── T-002: "Document features" → /research/dialpad_features.md
    │   └── Deliverable: dialpad_analysis.md
    │
    ├── US-002: "Analyze Smith.ai positioning"
    │   ├── Status: in_progress
    │   ├── Tasks
    │   │   ├── T-003: "Read about page" → /research/smithai_about.md [ACTIVE]
    │   │   └── T-004: "Check reviews" → Not started
    │   └── Agent Status: "Reading smith.ai/about..."
    │
    └── US-003: "Compare feature matrix"
        ├── Status: inbox
        └── Blocked by: US-001, US-002
```

### Firestore Collections

```
areas_of_investigation/
├── {areaId}
│   ├── title: string
│   ├── description: string
│   ├── agentId: string
│   ├── status: 'planned' | 'in_progress' | 'completed'
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── userStoryIds: string[]

user_stories/
├── {storyId}
│   ├── title: string
│   ├── description: string
│   ├── areaId: string
│   ├── agentId: string
│   ├── status: 'inbox' | 'in_progress' | 'review' | 'done'
│   ├── priority: 'P0' | 'P1' | 'P2' | 'P3'
│   ├── acceptanceCriteria: string[]
│   ├── createdAt: timestamp
│   ├── startedAt: timestamp
│   ├── completedAt: timestamp
│   ├── taskIds: string[]
│   ├── deliverableUrl: string
│   └── metadata: {
│       ├── estimatedHours: number
│       ├── actualHours: number
│       └── notes: string
│   }

tasks/
├── {taskId}
│   ├── title: string
│   ├── storyId: string
│   ├── agentId: string
│   ├── status: 'pending' | 'running' | 'completed' | 'failed'
│   ├── type: 'code' | 'research' | 'write' | 'review'
│   ├── artifactUrl: string (VS Code link or file path)
│   ├── description: string
│   ├── result: string
│   ├── createdAt: timestamp
│   ├── startedAt: timestamp
│   ├── completedAt: timestamp
│   ├── progress: string (real-time update)
│   └── cost: number

considerations/
├── {considerationId}
│   ├── areaId: string
│   ├── type: 'revenue_impact' | 'risk' | 'opportunity' | 'integration'
│   ├── title: string
│   ├── description: string
│   ├── severity: 'info' | 'warning' | 'critical'
│   ├── status: 'active' | 'addressed' | 'dismissed'
│   ├── createdBy: 'agent' | 'user'
│   ├── agentResponse: string
│   └── updatedAt: timestamp
```

---

## 🖥️ UI Components to Build

### 1. Investigation Board (New Main View)
**Replaces simple Kanban with hierarchical view**

```
┌─────────────────────────────────────────────────────────────────┐
│  AREAS OF INVESTIGATION                              [+ New]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔬 Research AI Receptionist Market    [Barak]   [In Progress] │
│  ├─ ✓ US-001: Analyze Dialpad pricing               [Done]    │
│  ├─ 🔄 US-002: Analyze Smith.ai positioning         [Active]  │
│  │   └─ 🟡 Reading about page... (Barak)                      │
│  └─ ⏸️ US-003: Compare feature matrix               [Blocked] │
│                                                                 │
│  🔬 Design Voice Workflow for Tradies  [Silk]    [In Progress] │
│  ├─ ⏸️ US-004: Map IVR decision tree                [Inbox]   │
│  └─ ⏸️ US-005: Write SMS sequences                  [Inbox]   │
│                                                                 │
│  [+ New User Story]                                             │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Expandable/collapsible areas
- Drag user stories between areas
- Click area to see detail view
- Real-time agent activity indicator

### 2. User Story Card

```
┌────────────────────────────────────────┐
│ [P1] US-002: Analyze Smith.ai          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Assigned: Barak (The Bear)  [🟢 Online]│
│ Status: In Progress                    │
│                                         │
│ Progress:                              │
│ ████████████░░░░░░ 60%                 │
│                                         │
│ Active Task:                           │
│ 🟡 Reading smith.ai/about...           │
│                                         │
│ [View Details] [Open Files]            │
└────────────────────────────────────────┘
```

### 3. User Story Detail Modal

```
┌────────────────────────────────────────────────────────────┐
│  US-002: Analyze Smith.ai positioning              [×]    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Assigned: Barak (The Bear)    Status: In Progress         │
│  Priority: P1                  Area: Market Research       │
│                                                             │
│  Description:                                               │
│  Deep dive into Smith.ai positioning, pricing, and         │
│  unique value propositions.                                 │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  TASKS                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                             │
│  ✓ T-003: Scrape pricing page                              │
│    └─ 📄 /research/smithai_pricing.md                      │
│                                                             │
│  🟡 T-004: Read about page (ACTIVE)                        │
│    └─ 👁️ Barak is reading...                               │
│    └─ [Open in VS Code] smithai_about.md                   │
│                                                             │
│  ⏸️ T-005: Check G2 reviews                                │
│                                                             │
│  [+ Add Task]                                              │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  DELIVERABLES                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                             │
│  📄 smithai_analysis.md (in progress)                      │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  AREAS TO CONSIDER                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                             │
│  💡 Smith.ai just raised $50M - pricing may change         │
│  [Reprompt] [Dismiss] [Add Comment]                        │
│                                                             │
│  ⚠️ Their AI voice is reportedly more natural              │
│  [Reprompt] [Dismiss] [Add Comment]                        │
│                                                             │
│  [+ Add Consideration]                                     │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 4. Task Assignment UI

**New button: "Assign to Agent"**

```
┌────────────────────────────────────────┐
│  Assign New Work                        │
├────────────────────────────────────────┤
│                                         │
│  Type:                                  │
│  ○ Area of Investigation (Epic)        │
│  ● User Story                          │
│  ○ Task                                │
│                                         │
│  Title: [____________________]         │
│                                         │
│  Assign to:                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  🤖    │ │  🐻    │ │  ✨    │  │
│  │ Garion │ │ Barak  │ │Polgara │  │
│  │ Master │ │Research│ │Content │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│                                         │
│  Context:                               │
│  [____________________]                │
│                                         │
│  Acceptance Criteria:                   │
│  • [____________________]              │
│  • [+ Add another]                     │
│                                         │
│  [Create & Spawn Agent]                │
└────────────────────────────────────────┘
```

### 5. Real-Time Agent Work Stream

**New panel on Mission Control:**

```
┌────────────────────────────────────────┐
│  🔴 LIVE AGENT ACTIVITY                │
├────────────────────────────────────────┤
│                                         │
│  🐻 Barak                              │
│  ├─ Working on: US-002                 │
│  ├─ Task: Reading smith.ai/about       │
│  ├─ File: /research/smithai_about.md   │
│  └─ Updated: 2 seconds ago             │
│     [👁️ Watch] [📝 View File]          │
│                                         │
│  🎭 Silk                               │
│  ├─ Working on: US-004                 │
│  ├─ Task: Designing IVR flow           │
│  ├─ File: /workflows/ivr_tradie.json   │
│  └─ Updated: 5 minutes ago             │
│     [👁️ Watch] [📝 View File]          │
│                                         │
└────────────────────────────────────────┘
```

---

## 🔧 Implementation Plan (Iterative)

### Phase 1: Core Data Model (Week 1)
**Goal:** New collections, migration, basic UI

**Tasks:**
1. Create Firestore collections: `areas_of_investigation`, `user_stories`, `considerations`
2. Update `tasks` collection with new fields (storyId, artifactUrl)
3. Migration script for existing data
4. Update TypeScript types
5. Build `useInvestigations` hook

**Test:** Create area → Create story → Verify in Firestore

---

### Phase 2: Investigation Board UI (Week 2)
**Goal:** Hierarchical view with drag-drop

**Tasks:**
1. Build `InvestigationBoard` component (replaces TaskBoard)
2. Implement expandable areas
3. Build `UserStoryCard` component
4. Add drag-and-drop between areas
5. Connect to Firestore real-time

**Test:** Drag story from one area to another → See update in real-time

---

### Phase 3: Task Assignment UI (Week 3)
**Goal:** No more chat-based assignment

**Tasks:**
1. Build `AssignWorkModal` component
2. Agent selector with capabilities
3. Form for context/acceptance criteria
4. Integration with agent spawner
5. Auto-create tasks when agent accepts

**Test:** Click "Assign to Barak" → Agent spawns → Task appears in story

---

### Phase 4: User Story Detail View (Week 4)
**Goal:** Click to see everything

**Tasks:**
1. Build `UserStoryDetailModal` component
2. Show tasks with status
3. Show deliverables with links
4. Show considerations
5. "Open in VS Code" buttons

**Test:** Click story → See all tasks → Click file → Opens in VS Code

---

### Phase 5: Real-Time Agent Activity (Week 5)
**Goal:** Watch agents work live

**Tasks:**
1. Update agent-executor to report granular progress
2. Heartbeat system for active file/task
3. Build `AgentActivityStream` component
4. Live file content diff viewer
5. Cost tracking per task

**Test:** Spawn agent → Watch progress update every 10 seconds → See "Reading X..."

---

### Phase 6: Interactive Considerations (Week 6)
**Goal:** User can guide agent work

**Tasks:**
1. Update considerations schema (editable)
2. Build `ConsiderationCard` component
3. Add [Reprompt], [Dismiss], [Comment] buttons
4. Escalation flow to Garion
5. Agent response logging

**Test:** Agent suggests consideration → User clicks [Reprompt] → Agent updates work

---

## 📊 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Task assignment via UI | 0% | 100% |
| User story visibility | None | Full hierarchy |
| Artifact navigation | None | 1-click to VS Code |
| Real-time updates | Manual | Every 10s |
| Consideration interaction | None | Edit/Dismiss/Reprompt |

---

## 🎨 Best Practices Applied

1. **Atomic Design:** Components broken down to atoms/molecules/organisms
2. **CQRS Pattern:** Separate read/write models for performance
3. **Optimistic UI:** Updates show immediately, sync in background
4. **Accessibility:** ARIA labels, keyboard navigation, color contrast
5. **Mobile-First:** Responsive design from 320px up
6. **Test-Driven:** Unit tests for hooks, integration for flows

---

## 🚨 Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Firestore costs with real-time | Client-side batching, pagination |
| Agent spamming updates | Debounce heartbeats (min 10s) |
| Broken VS Code links | Validate paths before showing |
| Data migration issues | Backup script, rollback plan |
| UI becomes cluttered | Progressive disclosure, collapsible sections |

---

## ✅ Next Step

**Ready to start Phase 1?** 

I can begin immediately with:
1. Firestore schema design
2. TypeScript type definitions
3. Migration scripts

**You'll see my progress in real-time through:**
- Mission Control updates (I'm working on it)
- Activity feed (each file I create)
- Git commits (if we add version control)

**Want me to start Phase 1 now?**
