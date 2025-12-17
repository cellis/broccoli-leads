# Broccoli Monorepo

A Turbo monorepo with three main applications:

- **Backend** - NestJS API with Zod contracts for TypeScript
- **Temporal** - Workflow orchestration for async tasks and job scheduling
- **Dashboard** - Next.js frontend for client management and configuration

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
pnpm install
```

### Development

Run all apps in development mode:

```bash
pnpm dev
```

Run specific apps:

```bash
# Backend only
pnpm --filter @broccoli/backend dev

# Temporal worker only
pnpm --filter @broccoli/temporal dev

# Dashboard only
pnpm --filter @broccoli/dashboard dev
```

### Building

Build all apps:

```bash
pnpm build
```

Build specific apps:

```bash
pnpm --filter @broccoli/backend build
pnpm --filter @broccoli/temporal build
pnpm --filter @broccoli/dashboard build
pnpm --filter @broccoli/contracts build
```

## Project Structure

```
broccoli/
├── apps/
│   ├── backend/          # NestJS API server
│   ├── temporal/         # Temporal workflow worker
│   └── dashboard/         # Next.js frontend
├── packages/
│   └── contracts/         # Shared Zod schemas and TypeScript types
├── turbo.json             # Turbo configuration
├── pnpm-workspace.yaml    # pnpm workspace configuration
└── package.json           # Root workspace configuration
```

## Apps

### Backend (`apps/backend`)

NestJS API server with:
- Zod contract validation
- TypeScript type safety
- CORS enabled for frontend communication
- Health check endpoint at `/health`

**Port:** 4000 (default)

### Temporal (`apps/temporal`)

Temporal workflow orchestration worker:
- Handles async task execution
- Job scheduling capabilities
- Workflow and activity definitions

**Requirements:**
- Temporal server running (default: `localhost:7233`)
- Set `TEMPORAL_ADDRESS` and `TEMPORAL_NAMESPACE` environment variables if needed

### Dashboard (`apps/dashboard`)

Next.js 14 frontend application:
- App Router architecture
- Tailwind CSS for styling
- TypeScript support
- Client management interface

**Port:** 3000 (default)

### Contracts (`packages/contracts`)

Shared Zod schemas and TypeScript types:
- API request/response schemas
- Workflow input/output schemas
- Type-safe contracts across all apps

## Environment Variables

Create `.env.local` files in each app directory as needed:

### Backend
```env
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### Temporal
```env
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
```

### Dashboard
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Scripts

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all apps
- `pnpm type-check` - Type check all apps
- `pnpm format` - Format code with Biome

## Type Safety

The monorepo uses shared Zod contracts from `@broccoli/contracts` to ensure type safety across:
- API requests/responses
- Workflow inputs/outputs
- Frontend-backend communication

Import contracts in your code:

```typescript
import { CreateClientRequestSchema, ClientResponse } from '@broccoli/contracts';
```

## License

Private

