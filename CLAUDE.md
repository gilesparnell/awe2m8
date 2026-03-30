# Parnell Systems Platform — Project Context for Claude Code

## What This Project Is

An internal systems platform for Parnell Systems. Provides admin tools for managing
Twilio numbers, GHL workflow triggers, client demos, and user administration.
Multi-channel communication (SMS, voice, Telegram). Previously named awe2m8/AllConvos — those names are retired.

## Current Tech Stack

- **Framework:** Next.js 15.2.6 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + clsx + tailwind-merge
- **Icons:** Lucide React
- **Auth:** NextAuth v5 (beta) with Google OAuth
- **Database:** PostgreSQL (Supabase) + Prisma v7 ORM
- **AI:** OpenAI SDK (migrating to Vercel AI SDK + Anthropic as primary)
- **SMS/Voice:** Twilio SDK
- **Hosting:** Vercel

## Project Structure

src/
├── app/
│   ├── [clientId]/          # Client-specific demo views
│   ├── admin/               # Admin dashboard
│   ├── api/                 # API route handlers (keep thin — logic in services)
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── clients/         # Client CRUD
│   │   ├── generate/        # AI generation endpoints
│   │   ├── ghl-triggers/    # GHL trigger CRUD
│   │   ├── telegram-webhook/ # Telegram bot webhook
│   │   └── twilio/          # Twilio webhook handlers
│   └── ghl-triggers/        # GoHighLevel trigger pages
├── components/
│   ├── admin/               # Admin-specific components
│   ├── auth/                # Auth components (SessionProvider wrapper)
│   └── modules/             # Reusable feature modules
├── generated/prisma/        # Generated Prisma client (do not edit)
├── lib/
│   ├── prisma.ts            # Prisma client singleton (v7 with PrismaPg adapter)
│   ├── admin-users.ts       # Admin user Prisma functions
│   ├── twilio-helpers.ts    # Twilio utilities (all Twilio logic lives here)
│   ├── auth.ts / auth.config.ts  # NextAuth setup
│   └── api-auth.ts          # API route authentication helper
├── hooks/                   # Custom React hooks
└── types/                   # TypeScript type definitions

## Key Architecture Decisions

### Database (Prisma v7)
- Uses `prisma-client` generator (NOT `prisma-client-js`) with `@prisma/adapter-pg` + `PrismaPg`
- Generated client at `src/generated/prisma/client`
- Prisma `Json` fields require `as unknown as TargetType` casts (not just `as TargetType`)
- Schema push: `prisma db push --accept-data-loss` for non-interactive environments

### Twilio
All Twilio SDK calls go through lib/twilio-helpers.ts. Never import the Twilio SDK
directly in API routes or components. Number purpose metadata is stored in PostgreSQL
via the TwilioNumberPurpose model.

## Migration Roadmap

1. ~~**Firebase → PostgreSQL/Prisma**~~ **DONE** (completed 2026-03-30)

2. **OpenAI SDK → Vercel AI SDK**
   - Wrap all AI calls in lib/ai.ts
   - Use streamText/generateText from the ai package
   - Anthropic Claude as primary model

3. **Add Resend** for transactional email (replace any ad-hoc email sending)

## Things to Never Do

- Never call Twilio SDK outside of lib/twilio-helpers.ts
- Never put business logic in API route handlers — services only
- Never hardcode API keys — use environment variables
- Never push directly to main
- Never use awe2m8 or AllConvos as names in new code — use Parnell Systems

## Environment Variables Required

NEXTAUTH_SECRET, NEXTAUTH_URL
DATABASE_URL (Supabase PostgreSQL connection string)
OPENAI_API_KEY
ANTHROPIC_API_KEY
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
TELEGRAM_BOT_TOKEN

## Running Locally

npm run dev           # Standard dev server
npm test              # Run test suite
npm run test:coverage # Coverage report

## Active Skills

.claude/skills/ should contain:
- code-quality
- git-conventions
- testing-practices
- frontend-design
- code-review
