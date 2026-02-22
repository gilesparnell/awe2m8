# Mission Control v3 - Complete Implementation Plan

## Status: Updated with Cost Fix & QA Review
**Critical Update:** Phase 0 added for cost tracking fix (currently broken - showing $0.00)
**New Addition:** Squad Showcase page in settings with avatar imagery
**QA Process:** Test-first development with Beldin oversight

## Core Architecture Decision
- **Real-time dashboard** approach for maximum visibility
- **Beautiful, functional UI** to restore confidence
- **Mobile-first responsive design** with dedicated mobile views
- **Test-first development** - tests written before code
- **Incremental delivery** with working features at each stage

## IMPLEMENTATION PHASES

### Phase 0: CRITICAL FIX - Cost Tracking (BLOCKING)
**Status:** BROKEN - All costs show $0.00
**Priority:** MUST complete before any other development

**Issues Found:**
- Activities logged without cost information
- Agent spawner tracks costs internally but doesn't log them
- Tool usage (web search, commands) doesn't attach costs
- Cost tracking hook reads from Firestore but costs never written

**Implementation:**
1. Update activity logger to accept cost parameters
2. Modify agent spawner to log actual costs when tasks complete
3. Update all tool usage to include costs
4. Test cost accuracy before proceeding

**Success Criteria:**
- [ ] Spawn agent → Activity shows real cost (not $0.00)
- [ ] Web search → Cost logged in Firestore
- [ ] Daily budget tracking enforced
- [ ] Budget alerts trigger correctly

### Phase 1: Foundation & Trust Building (Week 1)
**Goal:** Core infrastructure with visible progress

#### Frontend Tasks:
1. **Navigation Shell**
   - Left sidebar with module navigation
   - Top bar with user info, notifications
   - Mobile hamburger menu
   - Breadcrumb navigation

2. **Office Dashboard (Home)**
   - Today's summary card (cost, active tasks, agent status)
   - Quick action buttons (spawn agent, create task)
   - Recent activity feed (last 10 items)
   - Budget tracker with visual indicator

3. **Settings Framework**
   - Settings navigation structure
   - File browser for .md files
   - Priority ordering system
   - Click-to-edit functionality

#### Backend Tasks:
1. **Firebase Schema Setup**
   - Agents collection (status, config, performance)
   - Tasks collection (board items, status, assignments)
   - Activity logs collection
   - Memory indexing

2. **Real-time Infrastructure**
   - Firebase listeners for live updates
   - Activity logging service
   - Cost tracking per operation

3. **Agent Status Tracking**
   - Heartbeat mechanism
   - Status updates (idle/working/error)
   - Performance metrics collection

**Deliverable:** Working dashboard with live agent status

### Phase 2: Core Functionality (Week 2)
**Goal:** Essential features for daily use

#### Frontend Tasks:
1. **Task Board (Kanban)**
   - Three columns: To Do, In Progress, Done
   - Drag & drop between columns
   - Task cards with agent assignment
   - Cost per task display
   - Quick task creation modal

2. **Activity Feed**
   - Real-time updates
   - Filter by agent
   - Expandable details
   - Cost per activity

3. **Team View**
   - Agent cards with status
   - SOUL preview
   - Quick actions per agent

#### Backend Tasks:
1. **Task Management API**
   - CRUD operations for tasks
   - Agent assignment logic
   - Status tracking
   - Dependency management

2. **Activity Aggregation**
   - Real-time activity streaming
   - Cost calculation
   - Performance metrics

**Deliverable:** Fully functional task board and activity tracking

### Phase 3: Advanced Features (Week 3)
**Goal:** Intelligence and optimization

#### Frontend Tasks:
1. **Calendar View**
   - Weekly calendar layout
   - Agent assignment visualization
   - Task scheduling interface

2. **Memory Browser**
   - Searchable memory interface
   - Session transcript viewer
   - Decision log

3. **Global Search**
   - Command palette (Cmd+K)
   - Cross-module search
   - Quick actions

#### Backend Tasks:
1. **Search Indexing**
   - Full-text search setup
   - Memory indexing
   - Session transcript search

2. **Analytics & Insights**
   - Cost optimization suggestions
   - Performance analytics
   - Usage patterns

**Deliverable:** Intelligent features with search and insights

### Phase 4: Settings & Squad Showcase (Week 4)
**Goal:** Configuration management and team presentation

#### NEW: Squad Showcase Page
**File:** `/src/app/admin/mission-control/settings/squad/page.tsx`

**Features:**
- **Beautiful imagery** for each agent avatar
- **Core function display** - Area of responsibility
- **One-click edit** - Link to edit their SOUL.md
- **Grid layout** - Responsive, visually appealing
- **Agent stats** - Tasks completed, cost efficiency, uptime
- **Quick actions** - Spawn agent, view recent work

**Agent Cards Include:**
```
┌─────────────────────────────┐
│     [Agent Avatar]         │
│  Barak (The Bear)          │
│  🔍 Research Analyst       │
│  ----------------------------│
│  Tasks: 47 completed       │
│  Avg Cost: $0.23/task      │
│  Uptime: 99.2%            │
│                             │
│  [Edit SOUL] [Spawn]       │
└─────────────────────────────┘
```

#### Other Settings Pages:
1. **File Browser Enhancement**
   - Direct editing interface
   - Change tracking
   - File priority system

2. **Agent Configuration**
   - Model selection per agent
   - Cost limit adjustments
   - Capability toggles

3. **Integration Management**
   - API key management
   - Webhook configuration
   - External service connections

### Phase 5: Polish & Mobile (Week 5)
**Goal:** Mobile optimization and final polish

#### Frontend Tasks:
1. **Mobile-first Redesign**
   - Simplified mobile views
   - Touch-optimized interactions
   - Offline capability

2. **Performance Optimization**
   - Lazy loading
   - Caching strategy
   - Bundle optimization

#### Backend Tasks:
1. **Mobile API Optimization**
   - Compressed responses
   - Offline sync
   - Push notifications

2. **Security Hardening**
   - API authentication
   - Rate limiting
   - Data validation

**Deliverable:** Production-ready system with mobile support

## QA & TESTING STRATEGY

### Beldin's Review Process (CEO Oversight)
**Role:** Find every gap, risk, and flaw

**Review Checklist:**
1. **Technical Gaps**
   - Missing error boundaries
   - No fallback for Firebase failures
   - Race conditions in real-time updates
   - Memory leaks in listeners

2. **Security Concerns**
   - Firestore rules too permissive
   - No input validation on task creation
   - XSS vulnerabilities in markdown rendering
   - API endpoints exposed

3. **Performance Issues**
   - Too many Firebase reads per action
   - No pagination on activity feed
   - Large bundle size with all agents
   - No debouncing on search

4. **Edge Cases**
   - What happens when 100 tasks created simultaneously?
   - Firebase offline behavior
   - Agent heartbeat failure scenarios
   - Cost overflow calculations

5. **Business Logic Flaws**
   - Daily budget resets at wrong timezone
   - Cost aggregation double-counts
   - No audit trail for changes
   - Missing rate limiting

### Test-First Development Process

#### Pre-Implementation Testing:
1. **Write failing tests first** (Silk + Garion)
2. **Define test data fixtures**
3. **Mock Firebase operations**
4. **Set up test environment**

#### Test Categories:
1. **Unit Tests** (Critical functions)
   - Cost calculation accuracy
   - Agent spawning logic
   - Task state transitions
   - Budget enforcement

2. **Integration Tests** (APIs & Services)
   - Firebase read/write operations
   - Real-time update propagation
   - Error handling paths
   - Security rule validation

3. **E2E Tests** (User Flows)
   - Create task → Assign agent → Complete task
   - Cost tracking end-to-end
   - Settings file editing
   - Mobile navigation flows

#### Test Plan Document:
**File:** `/src/tests/TEST_PLAN.md`

**Must Include:**
- Test data setup
- Mock implementations
- Performance benchmarks
- Security test cases
- Mobile-specific tests

## RISKS & CONCERNS

### High Risk Items:
1. **Firebase Costs** - Real-time listeners could spike bills
2. **Cost Accuracy** - Wrong calculations could blow budget
3. **Mobile Performance** - Complex UI on mobile data
4. **Real-time Reliability** - Firebase offline/sync issues

### Medium Risk Items:
1. **Avatar Loading** - 10 high-res images could slow initial load
2. **Search Performance** - Full-text search on growing memory
3. **Settings Security** - Direct file editing vulnerabilities
4. **Agent Heartbeats** - False positives on agent status

### Mitigation Strategies:
1. **Cost Controls** - Daily spend alerts, listener limits
2. **Offline First** - Queue operations when offline
3. **Lazy Loading** - Load avatars on demand
4. **Error Boundaries** - Graceful failures everywhere
5. **Monitoring** - Sentry + Firebase analytics

## SUCCESS METRICS

### Technical Metrics:
- **System Reliability:** 99% uptime
- **Response Time:** <2s for all operations
- **Mobile Performance:** <3s load on 3G
- **Cost Accuracy:** 100% match with actual API usage

### User Experience Metrics:
- **Task Creation:** <5 seconds end-to-end
- **Agent Spawning:** <10 seconds with feedback
- **Settings Load:** <2 seconds with avatars
- **Error Rate:** <0.1% of operations

### Business Metrics:
- **Daily Active Use:** Track usage patterns
- **Cost Per Task:** Optimize for <$0.50 average
- **Agent Efficiency:** 95% task completion rate
- **User Satisfaction:** Intuitive navigation feedback

## IMPLEMENTATION ORDER

### Week 0 (CRITICAL):
- [ ] Fix cost tracking (Phase 0)
- [ ] Write test plan with Beldin
- [ ] Set up test environment
- [ ] Create avatar assets for squad showcase

### Week 1-5:
Follow phases 1-5 above with test-first approach

### Week 6:
- [ ] Full system testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment

**Next Immediate Action:** Fix cost tracking (Phase 0) while Beldin reviews test plan