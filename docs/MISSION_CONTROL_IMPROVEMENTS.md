# Mission Control - Improvements & Fixes Tracker

## 🔴 Critical Issues (Fix ASAP)

| # | Issue | Impact | Fix Approach |
|---|-------|--------|--------------|
| 1 | **Activity Feed needs Firestore indexes** | Activity page fails when filtering | Create composite indexes OR use client-side filtering (implemented) |
| 2 | **Port 3005 keeps getting stuck** | Dev server won't restart | Add graceful shutdown handler OR use different port detection |
| 3 | **No error boundary on Mission Control** | One error crashes entire page | Add React Error Boundary component |

## 🟠 High Priority

| # | Issue | Impact | Fix Approach |
|---|-------|--------|--------------|
| 4 | **Agent heartbeat only works on Mission Control page** | Agents show offline when on other pages | Move heartbeat to root layout or use service worker |
| 5 | **No validation on task creation form** | Can create empty tasks | Add Zod/yup validation schema |
| 6 | **Task status changes don't persist** | Moving cards in Kanban doesn't save | Add API route for task updates |
| 7 | **No loading states on mutations** | User doesn't know if action worked | Add toast notifications (sonner/react-hot-toast) |
| 8 | **Activity page stats don't auto-update** | Stats show stale data | Convert useActivityStats to real-time |

## 🟡 Medium Priority

| # | Issue | Impact | Fix Approach |
|---|-------|--------|--------------|
| 9 | **No task assignment from task detail modal** | Can't reassign tasks | Add agent dropdown in TaskDetailModal |
| 10 | **No task deletion/archiving** | Tasks accumulate forever | Add soft delete with "archived" status |
| 11 | **No search/filter on task board** | Hard to find tasks | Add client-side search + filters |
| 12 | **Agent cards don't show real workload** | Workload is hardcoded | Query tasks count per agent |
| 13 | **No export functionality** | Can't get data out | Add CSV/JSON export buttons |
| 14 | **Mobile responsiveness issues** | Bad on phone | Audit and fix responsive styles |

## 🟢 Nice to Have

| # | Feature | Value | Approach |
|---|---------|-------|----------|
| 15 | **Dark/light theme toggle** | User preference | Add next-themes |
| 16 | **Task templates** | Faster task creation | Predefined templates for common tasks |
| 17 | **Task dependencies** | Show blocked tasks | Add "blocked by" field to tasks |
| 18 | **Time tracking** | Billable hours | Track actual time spent per task |
| 19 | **Comments on tasks** | Collaboration | Add comments subcollection |
| 20 | **Task notifications** | Stay updated | Add in-app notification system |

## 🧪 Testing Gaps

| # | What to Test | Type | Status |
|---|--------------|------|--------|
| 1 | `useHeartbeat` hook | Unit | ❌ Missing |
| 2 | `useCreateTask` hook | Unit | ❌ Missing |
| 3 | `CreateTaskModal` component | Unit | ❌ Missing |
| 4 | `/api/agents/heartbeat` API | Unit | ❌ Missing |
| 5 | Task creation flow | Integration | ❌ Missing |
| 6 | Activity feed filtering | Integration | ❌ Missing |
| 7 | End-to-end Mission Control | System | ❌ Missing |

## 📝 Schema Improvements

| # | Collection | Current | Proposed |
|---|------------|---------|----------|
| 1 | `tasks` | No `tags` field | Add `tags: string[]` for categorization |
| 2 | `tasks` | No `dueDate` | Add `dueDate: Timestamp` for deadlines |
| 3 | `agents` | Simple status | Add `capabilities: string[]` for skill routing |
| 4 | `activities` | Limited metadata | Add `duration` for tracking operation time |

## 🔐 Security & Performance

| # | Issue | Risk | Fix |
|---|-------|------|-----|
| 1 | No rate limiting on heartbeat | DoS possible | Add rate limiter (upstash/lru-cache) |
| 2 | No input sanitization | XSS possible | Add zod validation on all inputs |
| 3 | Firestore rules not verified | Data exposure | Audit and tighten security rules |
| 4 | No request logging | Hard to debug | Add pino/winston logging |

---

**Last Updated:** 2026-02-17
**Next Review:** When errors are reported
