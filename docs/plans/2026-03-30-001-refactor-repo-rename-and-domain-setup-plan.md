---
title: "Rename repo to parnellsystems, add domain, set up Google Workspace"
type: refactor
status: active
date: 2026-03-30
---

# Rename repo to parnellsystems, add domain, set up Google Workspace

## Overview

Full migration from awe2m8 → parnellsystems identity:
1. Google Workspace setup for `parnellsystems.com` (gets `giles@parnellsystems.com`)
2. GitHub repo rename `gilesparnell/awe2m8` → `gilesparnell/parnellsystems`
3. Vercel domain `internal.parnellsystems.com`
4. Google OAuth updated for new domain
5. Firebase → Supabase migration (separate follow-up plan)

## Scope

**In scope (this plan):**
- Google Workspace Business Starter for `parnellsystems.com`
- Git remote + GitHub repo rename
- Vercel domain addition + DNS
- Google OAuth redirect URI update
- GitHub Actions workflow updates
- Vercel env var updates (NEXTAUTH_URL)

**Out of scope (separate plans):**
- Twilio references / env var renaming
- Firebase → Supabase migration (noted as follow-up, see bottom)
- Code-level awe2m8 references cleanup

---

## Execution Plan (wave-execute format)

### Wave 1 — Google Workspace Setup (blocks Wave 4 OAuth step)

**Step 1.1 — Sign up for Google Workspace Business Starter**
1. Go to https://workspace.google.com
2. Choose **Business Starter** (~A$12-13/user/month)
3. Use domain: `parnellsystems.com`
4. Create primary admin account: `giles@parnellsystems.com`

**Step 1.2 — Verify domain ownership**
1. Google will provide a TXT record for verification
2. Add the TXT record at your DNS provider for `parnellsystems.com`
3. Wait for verification to complete (usually minutes)

**Step 1.3 — Configure email DNS records**
Add these at your DNS provider for `parnellsystems.com`:
- **MX records** (5 Gmail MX records — Google provides these during setup)
- **SPF:** TXT record `v=spf1 include:_spf.google.com ~all`
- **DKIM:** TXT record (generated in Google Admin Console → Apps → Gmail → Authenticate email)
- **DMARC:** TXT record `v=DMARC1; p=quarantine; rua=mailto:giles@parnellsystems.com`

**Step 1.4 — Create Google Cloud project under new account**
1. Sign into https://console.cloud.google.com as `giles@parnellsystems.com`
2. Create a new project (e.g. "Parnell Systems Platform")
3. Enable the "Google Identity" / OAuth consent screen
4. Configure OAuth consent screen:
   - App name: Parnell Systems
   - User support email: `giles@parnellsystems.com`
   - Authorised domains: `parnellsystems.com`
5. Create OAuth 2.0 Client ID:
   - Type: Web application
   - Authorised JavaScript origins:
     - `https://internal.parnellsystems.com`
     - `http://localhost:3000`
   - Authorised redirect URIs:
     - `https://internal.parnellsystems.com/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google`
6. Note the new `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Wave 2 — GitHub Repo Rename (sequential, blocks Wave 3+)

**Step 2.1 — Rename the GitHub repo**
```bash
gh repo rename parnellsystems --repo gilesparnell/awe2m8 --yes
```
GitHub will auto-redirect old URLs (breaks if you ever create a new repo called `awe2m8`).

**Step 2.2 — Update local git remote**
```bash
cd /Users/gilesparnell/Documents/VSStudio/parnell-systems/parnellsystems-platform
git remote set-url origin https://github.com/gilesparnell/parnellsystems.git
git remote -v  # Verify
```

**Step 2.3 — Verify push/pull still works**
```bash
git fetch origin
```

### Wave 3 — Vercel + DNS (parallel tasks)

**Step 3.1 — Add domain in Vercel** (Vercel Dashboard)
1. Go to Vercel → Project Settings → Domains
2. Add `internal.parnellsystems.com`
3. Note the verification details Vercel provides
4. Do NOT remove `internal.awe2m8.ai` — keep both active

**Step 3.2 — Configure DNS for Vercel subdomain** (DNS provider)
1. Add a CNAME record:
   - **Name:** `internal`
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** Auto / 300
2. Wait for DNS propagation (usually < 5 minutes, can take up to 48h)
3. Vercel will auto-provision SSL once DNS resolves

**Step 3.3 — Reconnect repo in Vercel** (Vercel Dashboard)
1. Go to Vercel → Project Settings → Git
2. If Connected Repository shows `gilesparnell/awe2m8`, reconnect to `gilesparnell/parnellsystems`
3. Verify deployments still trigger on push

### Wave 4 — Update references + OAuth (parallel where noted)

**Step 4.1 — Update `monitor-bundles.yml`** (file edit)

File: `.github/workflows/monitor-bundles.yml:21`
```yaml
# Change from:
curl -X GET https://internal.awe2m8.ai/api/cron/check-bundles \
# To:
curl -X GET https://internal.parnellsystems.com/api/cron/check-bundles \
```

**Step 4.2 — Update `github-workflow-test.yml`** (file edit)

File: `.github/workflows/github-workflow-test.yml:1`
```yaml
# Change from:
name: AWE2M8 Tests
# To:
name: Parnell Systems Tests
```

**Step 4.3 — Update Vercel environment variables** (Vercel Dashboard)
1. Update/add `NEXTAUTH_URL` = `https://internal.parnellsystems.com` (Production, Preview)
2. Update `GOOGLE_CLIENT_ID` = new value from Wave 1 Step 1.4
3. Update `GOOGLE_CLIENT_SECRET` = new value from Wave 1 Step 1.4

**Step 4.4 — Update local `.env.local`** (file edit)
- Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with new values
- Keep `NEXTAUTH_URL=http://localhost:3000` (unchanged for local dev)

**Step 4.5 — Update Firebase admin whitelist**
- In Firestore, ensure `giles@parnellsystems.com` is added as an admin email
- Keep `giles@awe2m8.ai` in the whitelist too (so both accounts can log in during transition)

### Wave 5 — Commit, push, verify

**Step 5.1 — Commit workflow changes**
```bash
git add .github/workflows/monitor-bundles.yml .github/workflows/github-workflow-test.yml
git commit -m "refactor: update GitHub Actions for parnellsystems repo rename"
git push origin main
```

**Step 5.2 — Verify deployment**
1. Check Vercel dashboard — new deployment should trigger from the push
2. Visit `https://internal.parnellsystems.com/admin` — should load the admin dashboard
3. Visit `https://internal.awe2m8.ai/admin` — should still work (kept as fallback)
4. Check GitHub Actions tab — workflows should run under new repo

**Step 5.3 — Test Google OAuth login**
1. Go to `https://internal.parnellsystems.com/login`
2. Click "Continue with Google"
3. Sign in with `giles@parnellsystems.com`
4. Verify you land on the admin dashboard
5. Also test that `giles@awe2m8.ai` still works (if kept in whitelist)

**Step 5.4 — Test the cron workflow**
1. Go to GitHub → Actions → "Monitor Twilio Bundles"
2. Click "Run workflow" manually
3. Verify it hits `internal.parnellsystems.com` successfully

---

## Acceptance Criteria

- [ ] `giles@parnellsystems.com` email account is active
- [ ] GitHub repo accessible at `github.com/gilesparnell/parnellsystems`
- [ ] `git push` / `git pull` works with new remote
- [ ] `internal.parnellsystems.com/admin` loads correctly with SSL
- [ ] `internal.awe2m8.ai/admin` still works (not removed)
- [ ] Google OAuth login works on new domain with new credentials
- [ ] GitHub Actions trigger on push to new repo
- [ ] Monitor bundles cron hits the new domain
- [ ] Vercel deploys trigger from the renamed repo
- [ ] NEXTAUTH_URL points to new domain in Vercel env vars

## Rollback

- GitHub redirect from old repo name handles most issues automatically
- `git remote set-url origin https://github.com/gilesparnell/awe2m8.git` to revert locally
- Revert workflow file changes
- Old OAuth credentials still work on `internal.awe2m8.ai`
- Both domains remain active on Vercel

---

## Follow-up: Firebase → Supabase Migration

**Not part of this plan** — deserves its own dedicated plan. Key notes from CLAUDE.md:

- Current: Firebase/Firestore (`awe2m8-sales` project)
- Target: PostgreSQL via Prisma on Supabase
- CLAUDE.md already states this is priority migration
- When ready, run `/ce:plan` for the full Firebase → Supabase migration
- This will include: schema design, data migration scripts, Prisma setup, auth migration (Firebase Auth → Supabase Auth or keep NextAuth), env var updates
- The Google Workspace setup in this plan is independent of this migration
