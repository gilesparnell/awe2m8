# awe2m8 AI Squad Implementation Plan

## Executive Summary

**Goal:** Build an autonomous AI agent squad (10 agents) to automate awe2m8 operations, reduce manual work, and scale to $10k MRR by May.

**Key Priorities:**
1. Automate customer onboarding (reduce Gilo's time from 4hrs to 30 mins per customer)
2. Build custom workflow engine to replace Go High Level (save $250/customer/month)
3. **CRITICAL FIX:** Cost tracking shows $0.00 - must fix before any development

---

## 🚨 CRITICAL ISSUE - Phase 0 Required
**Status:** BLOCKED - Cost tracking broken in Mission Control
**Problem:** All activities show $0.00, no actual costs being captured
**Impact:** Cannot manage API budget without accurate cost tracking
**Solution:** See `COST_TRACKING_FIX_PLAN.md` - must complete before any other work

---

## The Squad: 10 Agents (Updated)

| # | Agent | Role | Model | When to Spawn | Status |
|---|-------|------|-------|---------------|--------|
| 1 | **Garion** | Master Controller | Claude 4.5 Sonnet | Always on | ✅ Active |
| 2 | **Barak** 🐻 | Research | Claude Haiku | Discovery phase | ✅ Active |
| 3 | **Silk** 🎭 | Code/Build | Codex/Claude | Implementation | ✅ Active |
| 4 | **Polgara** 🔮 | Content | Claude Haiku | Delivery phase | ✅ Active |
| 5 | **Ce'Nedra** 👑 | UX/Product | Claude Haiku | Design phase | ✅ Added |
| 6 | **Beldin** 🧪 | QA/Testing | Claude Haiku | Pre-launch | ✅ Added |
| 7 | **Taiba** 📊 | Analytics | Claude Haiku | Continuous | ✅ Added |
| 8 | **Relg** 📈 | Growth/Marketing | Claude Haiku | Growth phase | ➕ NEW |
| 9 | **Durnik** 🔧 | DevOps | Claude Haiku | Infrastructure | ➕ NEW |
| 10 | **Errand** ✨ | Innovation | Claude Haiku | R&D phase | ➕ NEW |
| 11 | **Mandorallen** 🛡️ | Security | Claude Haiku | Security audit | ➕ NEW |

### Agent Personalities (Belgariad Theme - Complete Squad)

**Barak (The Bear)** 🐻
- Role: Deep Research
- Specialty: Competitive analysis, market research
- Style: Thorough, evidence-based
- Deliverable: Research reports with sources

**Ce'Nedra (The Queen)** 👑
- Role: UX/Product Strategy
- Specialty: Voice/SMS UX, business automation workflows
- Style: Strategic, user-obsessed, polished
- Deliverable: UX audits, wireframes, user flows

**Beldin (The Sorcerer)** 🧪
- Role: QA & Testing
- Specialty: Edge cases, failure modes, load testing
- Style: Blunt and critical, shape-shifter mindset
- Deliverable: QA sign-off, bug reports, test coverage

**Silk (Prince Kheldar)** 🎭
- Role: Code/Trickster
- Specialty: Elegant solutions, automation scripts
- Style: Clever, efficient, cost-conscious
- Deliverable: Working code, automation pipelines

**Polgara (The Sorceress)** 🔮
- Role: Content & SEO
- Specialty: Writing, documentation, messaging
- Style: Wordcraft, brand voice consistency
- Deliverable: Copy, docs, SEO content

**Taiba (The Marag)** 📊
- Role: Analytics & Growth
- Specialty: Pattern recognition, data insights
- Style: Sees connections others miss
- Deliverable: Growth reports, metrics dashboards

**Relg (The Zealot)** 📈
- Role: Growth Marketer
- Specialty: Lead generation, conversion optimization
- Style: Data-driven, experimental, persistent
- Deliverable: Campaign strategies, growth experiments

**Durnik (The Smith)** 🔧
- Role: DevOps Engineer
- Specialty: Infrastructure, deployment, automation
- Style: Reliable, methodical, always prepared
- Deliverable: CI/CD pipelines, infrastructure as code

**Errand (The Child)** ✨
- Role: Innovation Scout
- Specialty: Emerging tech, R&D, training systems
- Style: Curious, experimental, quick learner
- Deliverable: Tech evaluations, training materials

**Mandorallen (The Knight)** 🛡️
- Role: Security Specialist
- Specialty: Security audits, compliance, risk assessment
- Style: Honorable, protective, thorough
- Deliverable: Security reports, compliance documentation

---

## Deterministic Workflow

### Standard Task Flow

```
Barak (Research) → Ce'Nedra (UX Review) → Silk (Build) 
→ Beldin (QA) → Polgara (Content) → Taiba (Analytics)
→ Garion (Final Review)
```

Each agent:
1. Spawns in fresh session
2. Completes specific task
3. Writes output to shared database
4. Triggers next agent or escalates to human

### Verification Chain

Agents verify each other's work:
- Silk doesn't just accept Barak's research — validates against requirements
- Beldin tests Silk's code before it ships
- Garion (Gilo) reviews critical decisions

---

## Phase 0: CRITICAL FIX - Cost Tracking (BLOCKING ALL DEVELOPMENT)

**🚨 STATUS:** BROKEN - All costs show $0.00 in Mission Control
**IMPACT:** Cannot manage API budget or track real spend
**DURATION:** 2-3 hours (must fix before any other work)

**Fix Required:**
- Update activity logger to accept cost parameters
- Modify agent spawner to log actual costs
- Update all tool usage to include costs
- Test that real costs appear in UI

**Success Criteria:**
- [ ] Spawn agent → Activity shows real cost (not $0.00)
- [ ] Web search → Cost logged in Firestore
- [ ] Daily budget tracking enforced
- [ ] Budget alerts trigger correctly

**See:** `COST_TRACKING_FIX_PLAN.md` for detailed implementation

## Phase 1: Foundation (Weeks 1-2)

**Goal:** Mission Control dashboard working with real data

**Deliverables:**
- React Mission Control UI with hierarchical sidebar
- Agent status bar showing all 10 agents
- Task detail panel (replaces modal)
- SQLite state tracking
- Cost tracker in header (REAL costs, not $0.00)
- **NEW:** Squad Showcase page in settings with agent avatars

**Agents Active:**
- Garion (always)
- Occasional Barak for research

---

## Phase 2: Customer Onboarding Automation (Weeks 3-6)

**⚠️ PRIORITY #1 — Immediate ROI**

**Current Pain:** 4 hours manual work per customer
**Target:** 30 minutes, zero manual steps

**Workflow:**

1. **Barak** — Research current manual steps
   - Document: Phone provisioning, GHL setup, AI config, testing
   - Interview Gilo on exact process
   - Identify bottlenecks and failure points

2. **Ce'Nedra** — Design optimal onboarding UX
   - "What would make Gilo's life easiest?"
   - Design fallback paths when automation fails
   - Customer communication templates

3. **Silk** — Build automation scripts
   - Twilio API for phone number provisioning
   - GHL API for workflow creation
   - Assistable API for AI agent setup
   - Error handling and retries

4. **Beldin** — Test with 10 scenarios
   - Edge cases: Failed provisioning, wrong area codes, API downtime
   - Recovery paths: "If phone fails, alert Gilo immediately"
   - Load test: Can we onboard 5 customers simultaneously?

5. **Taiba** — Measure impact
   - "Saved Gilo 3.5 hours per customer"
   - Cost per onboarding (Twilio + API costs)
   - Time to first value for customer

6. **Garion** — Deploy
   - Run for 2 real customers with Gilo supervising
   - Then full automation

**Success Metric:** New customer fully onboarded in <30 minutes with zero manual steps from Gilo.

---

## Phase 3: GHL Workflow Engine (Weeks 7-16)

**⚠️ PRIORITY #2 — Cost Savings**

**Current Cost:** $297/month per customer (GHL subscription)
**Target:** $47/month per customer (infrastructure only)
**Savings:** $250/customer/month × 25 customers = $6,250/month

### Strategy: Gradual Replacement (Not Big Bang)

**Why gradual?**
- GHL is massive (CRM + Workflows + SMS + Email + Calendar + Payments)
- Building everything = 6-9 months, high risk
- Better: Build what you actually use, integrate with GHL CRM

### Implementation

1. **Barak** — Architect approach
   - Map current GHL workflow features → your actual needs
   - Research: What do your customers actually use?
   - Design: Modular system (start small, expand)

2. **Ce'Nedra** — Design workflow builder UI
   - Visual flow builder (or text-based config)
   - Intuitive for non-technical users
   - Templates for common patterns

3. **Silk** — Build core engine (4 weeks)
   - Trigger system: Incoming call, SMS, time-based, webhook
   - Action system: Send SMS, transfer call, update CRM, HTTP request
   - Conditional logic: If/then/else, wait delays
   - Integration: Twilio, Firebase, external APIs

4. **Beldin** — Extensive testing (2 weeks)
   - Load testing: 1000 concurrent workflows
   - Failure modes: What happens when Twilio is down?
   - Recovery: Auto-retry, alert escalation

5. **Polgara** — Migration guide
   - "How to move from GHL to custom workflows"
   - Customer communication
   - Training materials

6. **Taiba** — Cost analysis
   - GHL: $297/mo/customer
   - Custom: $47/mo/customer (Twilio + Firebase + Vercel)
   - Break-even: After 10 customers on custom platform

**Success Metric:** 50% of new customers on custom workflows (keep GHL for legacy until migration complete).

---

## Critical Risks & Mitigations

### Risk 1: Cost Explosion 💰

**Problem:** 7 agents × multiple sessions/day = $50-100/day in API costs

**Reality Check:**
- At $10k MRR target, you can afford ~$10-15/day in AI costs
- That's ~200-300 agent sessions per day

**Mitigation:**
- Only spawn agents when needed (not on heartbeat)
- Batch similar tasks (Barak researches 5 competitors in one session)
- Use cheapest viable model (Haiku for most tasks)
- Garion (expensive model) only for complex decisions

### Risk 2: Coordination Overhead

**Problem:** 7 agents = complex handoffs. One failure breaks the chain.

**Example:** Barak completes → Ce'Nedra spawned → Session crashes → Work lost

**Mitigation:**
- SQLite state tracking (like Antfarm)
- Each agent writes to DB before exiting
- Failed steps auto-retry (max 3 attempts)
- Human intervention only after 3 failures

### Risk 3: Context Window Limits

**Problem:** Customer onboarding has many steps. One agent can't hold it all.

**Solution:** Break into sub-workflows:
- Silk-1: Phone provisioning
- Silk-2: GHL workflow creation
- Silk-3: AI prompt configuration
- Silk-4: Testing automation

Each writes to DB, next picks up where previous left off.

### Risk 4: GHL Replacement Complexity

**Problem:** Building full GHL replacement = $100k+ engineering project

**Better Strategy:**
- Phase 1: Automate GHL usage (reduce manual work) ✅
- Phase 2 ($50k MRR): Build 1 custom module (workflows only)
- Phase 3 ($200k MRR): Full GHL replacement

**Immediate Win:** Automation reduces Gilo's time from 4hrs to 30 mins per customer.

---

## Cost Projection

| Phase | Duration | Est. AI Cost | Business Impact |
|-------|----------|--------------|-----------------|
| Phase 1 | 2 weeks | $200 | Working Mission Control |
| Phase 2 | 4 weeks | $400 | Save 10hrs/week of Gilo's time |
| Phase 3 | 10 weeks | $1,000 | Save $6,250/mo in GHL costs |
| **Total** | **16 weeks** | **$1,600** | **$10k MRR + massive time savings** |

---

## Next Steps

### This Week:
1. Create `mission-control-v2` branch in VSStudio
2. Update Mission Control UI with new design (hierarchical sidebar, agent status bar)
3. Add Ce'Nedra and Beldin to agent roster
4. Begin Phase 2 planning (onboarding automation)

### Success Metrics to Track:
- Time per customer onboarding (target: <30 mins)
- Cost per day in AI agents (target: <$15)
- Monthly recurring revenue (target: $10k by May)
- GHL cost per customer (target: reduce by 50%)

---

## Questions for Jesse

1. Does this agent structure make sense for our customer base?
2. Should we prioritize any other automation beyond onboarding and GHL replacement?
3. What concerns do you have about the cost or complexity?
4. Any features you think customers would pay more for that we should build?

---

*Document created: 2026-02-19*
*For: awe2m8 internal planning*
*Next review: Weekly during implementation*