# AllConvos — Project Context for Claude Code

## What This Project Is

AllConvos is an AI-powered SaaS platform for SMEs. It provides conversational AI agents,
a Mission Control dashboard for managing agent tasks, and multi-channel communication
(SMS, voice, Telegram). Previously named awe2m8 — that name is retired.

## Current Tech Stack

- **Framework:** Next.js 15.2.6 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + clsx + tailwind-merge
- **Icons:** Lucide React
- **Auth:** NextAuth v5 (beta)
- **Database:** Firebase/Firestore (migrating to PostgreSQL + Prisma — see migration notes below)
- **AI:** OpenAI SDK (migrating to Vercel AI SDK + Anthropic as primary)
- **SMS/Voice:** Twilio SDK
- **Agent Orchestration:** OpenClaw (reads from subagents/runs.json via openclaw-bridge.ts)
- **Hosting:** Vercel

## Project Structure

src/
├── app/
│   ├── [clientId]/          # Client-specific views
│   ├── admin/               # Admin dashboard
│   ├── api/                 # API route handlers (keep thin — logic in services)
│   │   ├── agents/          # Agent heartbeat and status
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── costs/           # Cost tracking
│   │   ├── generate/        # AI generation endpoints
│   │   ├── task-registry/   # OpenClaw task registry
│   │   ├── telegram-webhook/ # Telegram bot webhook
│   │   └── twilio/          # Twilio webhook handlers
│   ├── ghl-triggers/        # GoHighLevel trigger handlers
│   └── mission-control/     # Mission Control dashboard pages
├── components/
│   ├── admin/               # Admin-specific components
│   ├── auth/                # Auth components
│   ├── mission-control/     # Mission Control UI
│   └── modules/             # Reusable feature modules
├── lib/
│   ├── firebase.ts          # Firebase client
│   ├── firebase-admin.ts    # Firebase Admin SDK
│   ├── openclaw-bridge.ts   # Reads OpenClaw runs.json → Mission Control format
│   ├── twilio-helpers.ts    # Twilio utilities (all Twilio logic lives here)
│   ├── auth.ts / auth.config.ts  # NextAuth setup
│   └── task-registry.ts    # Task management
├── hooks/                   # Custom React hooks
└── types/                   # TypeScript type definitions

## Key Architecture Decisions

### OpenClaw Bridge
lib/openclaw-bridge.ts reads from OpenClaw subagents/runs.json and transforms
the data into Mission Control task format. This is the bridge between agent
spawning (OpenClaw) and the dashboard UI. Do not bypass this — always go through
the bridge when reading agent session data.

### Twilio
All Twilio SDK calls go through lib/twilio-helpers.ts. Never import the Twilio SDK
directly in API routes or components. This was a source of repeated bugs.

### Firebase (Current — Being Migrated)
Currently using Firebase/Firestore for persistence. This works but is expensive
and hard to query. The migration path is to PostgreSQL via Prisma on Supabase.
When writing new features, prefer writing them in a way that will be easy to
migrate (avoid deeply nested Firestore document patterns).

### Mission Control
The main dashboard. Shows active agent tasks, costs, activity feeds. The
openclaw-bridge.ts feeds this with live agent data.

## Migration Roadmap

1. **Firebase → PostgreSQL/Prisma** (priority)
   - New features: write to Prisma if possible
   - Existing: migrate model by model
   
2. **OpenAI SDK → Vercel AI SDK**
   - Wrap all AI calls in lib/ai.ts
   - Use streamText/generateText from the ai package
   - Anthropic Claude as primary model

3. **Add Resend** for transactional email (replace any ad-hoc email sending)

## Things to Never Do

- Never call Twilio SDK outside of lib/twilio-helpers.ts
- Never call Firebase outside of lib/firebase.ts or lib/firebase-admin.ts
- Never put business logic in API route handlers — services only
- Never hardcode API keys — use environment variables
- Never push directly to main
- Never use awe2m8 as a name in new code — use AllConvos or allconvos

## Environment Variables Required

NEXTAUTH_SECRET, NEXTAUTH_URL
FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
TELEGRAM_BOT_TOKEN

## Running Locally

npm run dev           # Standard dev server
npm run dev:openclaw  # Dev server with OpenClaw integration
npm test              # Run test suite
npm run test:coverage # Coverage report

## Active Skills

.claude/skills/ should contain:
- code-quality
- git-conventions
- testing-practices
- frontend-design
- code-review
