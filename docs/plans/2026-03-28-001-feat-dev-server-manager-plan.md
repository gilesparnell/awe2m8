---
title: "feat: Add Dev Server Manager to admin tools"
type: feat
status: completed
date: 2026-03-28
---

# feat: Add Dev Server Manager to Admin Tools

## Overview

Add a 7th tool card to the `/admin` dashboard — a "Dev Server Manager" that shows all locally running dev servers, their ports, clickable URLs, and process info. Users can start/stop servers and manually register new ones. This is a **dev-only tool** (guarded by `NODE_ENV`).

## Problem Statement / Motivation

When working across multiple projects and agent worktrees, it's easy to lose track of which dev servers are running on which ports. Existing tools (Port Keeper, Portless, Port-Kill) are standalone apps — this brings the same capability **into** the AllConvos admin dashboard, tailored to our workflow.

## Proposed Solution

### New Files

| File | Purpose |
|------|---------|
| `src/app/admin/dev-servers/page.tsx` | Main dashboard page |
| `src/app/api/admin/dev-servers/route.ts` | GET: list servers |
| `src/app/api/admin/dev-servers/start/route.ts` | POST: start a server |
| `src/app/api/admin/dev-servers/stop/route.ts` | POST: stop a server |
| `src/hooks/useDevServers.ts` | Polling hook (5s interval) |
| `src/types/dev-server.ts` | Type definitions |
| `src/lib/dev-server-scanner.ts` | Port scanning + process resolution logic |

### Modified Files

| File | Change |
|------|--------|
| `src/app/admin/page.tsx` | Add 7th tool card (red/rose theme) |

## Technical Considerations

### Security (Critical)

Every API route MUST:
1. Check `process.env.NODE_ENV !== 'development'` → return 403
2. The start endpoint does NOT accept arbitrary shell commands. It accepts `{ cwd: string, script: string }` and runs `npm run <script>` in the specified directory. No pipe operators, no sudo, no arbitrary commands.

### Port Scanning Approach

Use `lsof -iTCP -sTCP:LISTEN -n -P` (macOS) to detect listening processes. Scan a **discrete list** of known dev ports, not the full 3000-9090 range:

```
[3000, 3001, 3002, 4000, 4200, 4321, 5000, 5173, 5174, 8000, 8080, 8888, 9000, 9090]
```

### App Name Resolution

For each detected process:
1. Get the process's cwd from `lsof` output or `ps -o command=`
2. Walk up directories to find nearest `package.json`
3. Use `package.json` → `name` field
4. Fallback: binary name + port (e.g. "node :3000")

### Persistence

Manually added server configs stored in `.allconvos/dev-servers.json` in the project root. Schema:

```json
[{ "name": "My App", "cwd": "/path/to/project", "script": "dev", "port": 3000 }]
```

### Process Management

- Spawned processes use `{ detached: true, stdio: 'ignore' }` so they survive Next.js restarts
- Before killing a PID, verify it still listens on the expected port
- Send `SIGTERM` first, not `SIGKILL`

### Auto-Refresh UX

- Data fetch every 5s via `setInterval` in `useDevServers` hook
- Server list updates without remounting the form component
- Pause polling while "add server" form is open (use ref flag)

## Acceptance Criteria

- [ ] Red/rose tool card appears on `/admin` page with icon, title, description
- [ ] `/admin/dev-servers` page loads and auto-detects running dev servers
- [ ] Each server row shows: name, port, clickable `http://localhost:{port}` URL, PID, status badge
- [ ] "Stop" button kills the process (with PID validation)
- [ ] "Add Server" form accepts name, cwd, script, port — starts the server
- [ ] Started servers appear in the list on next refresh
- [ ] Manual configs persist in `.allconvos/dev-servers.json`
- [ ] All API routes return 403 if `NODE_ENV !== 'development'`
- [ ] Auto-refresh every 5 seconds without disrupting form state
- [ ] All code has tests written BEFORE implementation (TDD)

## Implementation Phases

### Phase 1: Types + Scanner Logic (TDD)

**Test first**, then implement:

1. `src/types/dev-server.ts` — `DevServer`, `DevServerConfig` interfaces
2. `src/lib/dev-server-scanner.ts` — `scanPorts()`, `resolveAppName()`, `getRunningServers()`
3. Tests: mock `lsof` output, verify parsing, name resolution, edge cases (no package.json, zombie PIDs)

### Phase 2: API Routes (TDD)

**Test first**, then implement:

1. `GET /api/admin/dev-servers` — calls scanner, merges with persisted configs, returns list
2. `POST /api/admin/dev-servers/stop` — validates PID, sends SIGTERM
3. `POST /api/admin/dev-servers/start` — validates input, spawns detached process, saves to config
4. Tests: NODE_ENV guard, input validation, error responses, happy paths

### Phase 3: Hook + UI

1. `src/hooks/useDevServers.ts` — polling hook following `useCostTracking` pattern
2. `src/app/admin/dev-servers/page.tsx` — full page with server list, status badges, action buttons, add form
3. `src/app/admin/page.tsx` — add 7th card

### Phase 4: Integration Polish

1. End-to-end manual testing
2. Handle edge cases: port already in use on start, process crashed between refreshes
3. Loading/error states with `Loader2` spinner pattern

## UI Design

### Tool Card (on /admin)
- **Color:** red/rose (`rose-500`, `rose-400`, `rose-900`)
- **Icon:** `Server` from lucide-react
- **Title:** "Dev Server Manager"
- **Description:** "Monitor & control your local development servers"
- **CTA:** "Launch Tool →"

### Page Layout
- Standard admin page pattern: back link, badge ("Dev Tools"), gradient title
- **Server list:** Table/card rows with columns: Name, Port, URL, PID, Status, Actions
- **Status badges:** green "Running", gray "Stopped", amber "Starting"
- **Actions:** Stop button (red), Start button (green), Open URL button (external link)
- **Add Server form:** Collapsible panel at top with fields: Name, Project Directory, NPM Script, Port

## Dependencies & Risks

- **macOS only:** `lsof` flags are macOS-specific. Linux would need different flags. This is acceptable since it's a local dev tool.
- **Port scanning performance:** Scanning ~15 specific ports via `lsof` every 5s is negligible overhead.
- **PID recycling:** Mitigated by verifying PID-port association before kill.

## Sources & References

### Internal References
- Admin page pattern: `src/app/admin/page.tsx`
- Tool page pattern: `src/app/admin/ghl-assistable-debug/page.tsx`
- API route pattern: `src/app/api/agents/heartbeat/route.ts`
- Polling hook pattern: `src/hooks/useCostTracking.ts`
- Auth pattern: `src/app/api/admin/users/route.ts`
- Type pattern: `src/types/index.ts`
