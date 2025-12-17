# AGENTS.md

## Recommended Tech Stack

We work with a turbo monorepo with three main apps:

- **backend (flexible)** - NestJS + zod contracts for TypeScript
- **temporal (required, important)** - Workflow orchestration for async tasks and job scheduling
- **dashboard (flexible)** - Next.js frontend for client management and configuration

## Backend Expectations

- The backend endpoint should be able to receive an email (for example from agentmail.to) and parse it into structured fields so downstream services can act on the message.

