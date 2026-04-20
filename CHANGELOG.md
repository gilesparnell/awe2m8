# Changelog

All notable changes. Bumped on every PR that ships to production.

## Conventions
- patch (0.0.x) — bug fixes, copy tweaks, dependency bumps
- minor (0.x.0) — new features, new pages, new tracked events
- major (x.0.0) — breaking changes

Each entry is split into:
- **What's new** — customer-facing outcomes
- **Under the hood** — technical detail (rendered dimmer in-app)

---

## [0.1.1] — 2026-04-20

### What's new
- Your name in the admin users list now matches your Google profile, instead of showing "Unknown" when you sign in for the first time.

### Under the hood
- `updateLastLogin(email, googleName?)` in `src/lib/admin-users.ts` now takes the Google-provided display name and syncs it into `admin_users.name` on every sign-in.
- Wired in `src/lib/auth.ts` so the `signIn` callback passes `user.name` through. Null / empty `googleName` is a no-op so existing admin records without a Google login are untouched.
- Unit tests in `__tests__/unit/lib/admin-users.test.ts` cover the backward-compatible single-arg path, the name-sync path, lower-casing, and the null / undefined / empty-string edge cases.
- Follow-up work outstanding (not in this PR): in-app version display in the footer, `/health` endpoint, build-time SHA injection. Tracked separately.
