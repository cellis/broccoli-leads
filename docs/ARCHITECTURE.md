# Broccoli Architecture

## Overview

Broccoli is a lead processing system built as a Turborepo monorepo. It ingests emails from external providers (like AgentMail), extracts structured lead information using AI, and persists the results to a PostgreSQL database.

The system is designed around **durability** and **observability**. Rather than processing leads inline in a web request (which could fail silently or timeout), we hand off work to Temporal—a workflow orchestration engine that guarantees execution, handles retries, and maintains a complete audit trail.

---

## How It Works (The Short Version)

1. **Email arrives** → AgentMail sends a webhook to our backend
2. **Backend receives it** → Validates the payload, creates a Temporal workflow
3. **Temporal processes it** → Pulls a prompt from LangSmith, calls OpenAI to extract lead info
4. **Lead gets saved** → Structured data persisted to PostgreSQL
5. **Dashboard displays it** → (Future) Leads visible in the Next.js dashboard

---

## System Components

### `apps/backend` — NestJS API Server

The backend is the entry point for all external integrations. It:

- **Receives webhooks** from email providers (AgentMail)
- **Validates payloads** using Zod schemas (shared via `@broccoli/contracts`)
- **Kicks off workflows** by connecting to Temporal and starting a `processLeadWorkflow`
- **Does NOT process leads inline** — it immediately returns after starting the workflow

Key files:
- `app.controller.ts` — HTTP endpoints, including `POST /emails/agentmail`
- `temporal.service.ts` — Temporal client wrapper for starting workflows
- `app.service.ts` — Utility functions like raw email parsing

### `apps/temporal` — Temporal Worker

This is where the actual work happens. The Temporal worker:

- **Runs workflows** — Long-running, durable functions that survive restarts
- **Executes activities** — Individual units of work (API calls, DB writes)
- **Handles retries** — If LangSmith or OpenAI fails, Temporal retries automatically

Key files:
- `workflows/index.ts` — The `processLeadWorkflow` definition
- `activities/index.ts` — `pullAndFormatPrompt`, `callOpenAICompletion`, `saveLead`
- `index.ts` — Worker bootstrap and Temporal connection

### `apps/dashboard` — Next.js Frontend

The dashboard provides a UI for:
- Viewing and managing leads
- Monitoring workflow status
- System configuration

Currently a skeleton—will be built out as the system matures.

### `packages/contracts` — Shared Types

Zod schemas and TypeScript types shared between backend and temporal:
- `LeadProcessingInput` / `LeadProcessingResult`
- `AgentMailMessage`, `AgentMailEvent`
- API request/response schemas

---

## Data Flow

```
┌─────────────────┐
│   Email Sender  │
│  (e.g. Gmail)   │
└────────┬────────┘
         │ Email
         ▼
┌─────────────────┐
│    AgentMail    │
│  (email inbox)  │
└────────┬────────┘
         │ Webhook POST /emails/agentmail
         ▼
┌─────────────────┐
│     Backend     │
│    (NestJS)     │
│                 │
│ • Validate      │
│ • Start workflow│
└────────┬────────┘
         │ workflow.start()
         ▼
┌─────────────────┐
│    Temporal     │
│    (Worker)     │
│                 │
│ • Pull prompt   │──────▶ LangSmith
│ • Call OpenAI   │──────▶ OpenAI
│ • Save lead     │
└────────┬────────┘
         │ INSERT
         ▼
┌─────────────────┐
│   PostgreSQL    │
│  broccoli.leads │
└─────────────────┘
```

---

## Why Temporal?

Email processing is inherently unreliable:
- External APIs fail (LangSmith, OpenAI)
- Network hiccups happen
- Servers restart mid-processing

Temporal solves this by:

1. **Durability** — Workflows survive worker restarts
2. **Automatic retries** — Failed activities retry with backoff
3. **Visibility** — Full history of every workflow execution
4. **Timeouts** — Activities have configurable timeouts (60s default)

When the backend starts a workflow, it returns immediately. The actual processing happens asynchronously in the Temporal worker, and if anything fails, Temporal handles the retry logic.

---

## Database Schema

Leads are stored in a `broccoli` schema (not `public`):

```sql
broccoli.leads
├── id (UUID, PK)
├── customer_name (VARCHAR)
├── customer_number (VARCHAR)
├── customer_address (TEXT)
├── provider (VARCHAR) -- e.g., 'agentmail'
├── provider_lead_id (VARCHAR) -- original message ID
├── org_id (UUID)
├── status (ENUM: new, contacted, qualified, converted, lost, archived)
├── lead_raw_data (JSONB) -- full context from the email
├── chat_channel (ENUM: sms, email, whatsapp, phone, web, other)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

---

## Environment Variables

| Variable | Where Used | Purpose |
|----------|-----------|---------|
| `DATABASE_URL` | temporal | PostgreSQL connection string |
| `TEMPORAL_ADDRESS` | backend, temporal | Temporal server address |
| `TEMPORAL_NAMESPACE` | backend, temporal | Temporal namespace |
| `LANGSMITH_API_KEY` | temporal | LangSmith prompt hub access |
| `OPENAI_API_KEY` | temporal | OpenAI API access |

---

## Running Locally

```bash
# Start all services (backend, temporal, dashboard)
pnpm dev

# Or individually
pnpm --filter @broccoli/backend dev
pnpm --filter @broccoli/temporal dev
pnpm --filter @broccoli/dashboard dev
```

You'll also need:
- **Temporal server** running on `localhost:7233`
- **PostgreSQL** with the migrations applied

---

## Future Considerations

- **Dashboard integration** — Display leads, workflow status
- **SMS/WhatsApp channels** — Additional lead sources beyond email
- **Lead assignment** — Route leads to specific team members
- **Response automation** — Auto-reply to leads via the same channel

