# Broccoli Dashboard

Next.js 14 frontend for managing leads and monitoring the Broccoli lead processing system.

## Tech Stack

- **Next.js 14** — App Router architecture
- **HeroUI** — Modern React component library
- **Tailwind CSS v4** — Utility-first styling with CSS-based configuration
- **TypeScript** — Full type safety with shared contracts

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Backend API running on `http://localhost:4000`

### Installation

From the monorepo root:

```bash
pnpm install
```

### Development

```bash
# From monorepo root
pnpm --filter @broccoli/dashboard dev

# Or from this directory
pnpm dev
```

The dashboard runs on **http://localhost:3000** by default.

### Build

```bash
pnpm build
pnpm start
```

## Environment Variables

Create a `.env.local` file:

```env
# Backend API URL (defaults to http://localhost:4000)
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Project Structure

```
dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout with HeroUIProvider
│   │   ├── page.tsx        # Homepage with stats overview
│   │   ├── providers.tsx   # Client-side providers (HeroUI)
│   │   ├── globals.css     # Tailwind v4 + HeroUI imports
│   │   └── leads/
│   │       └── page.tsx    # Leads management page
│   ├── components/
│   │   └── LeadsTable.tsx  # Interactive leads table
│   └── lib/
│       └── api.ts          # Backend API client
├── hero.ts                 # HeroUI theme configuration
├── postcss.config.js       # PostCSS with Tailwind v4
└── tsconfig.json
```

## Features

### Lead Management (`/leads`)

- **View all leads** — Paginated table with customer details
- **Filter by status** — Click status chips to filter (New, Contacted, Qualified, etc.)
- **Update status** — Dropdown menu to change lead status inline
- **Channel indicators** — Visual icons for email, SMS, WhatsApp, phone, web

### Dashboard Home (`/`)

- **Quick stats** — Total leads and new lead count
- **System overview** — Architecture diagram
- **Navigation** — Quick access to leads page

## Lead Statuses

| Status | Color | Description |
|--------|-------|-------------|
| `new` | Blue | Fresh lead, not yet contacted |
| `contacted` | Purple | Initial contact made |
| `qualified` | Yellow | Lead is qualified/interested |
| `converted` | Green | Successfully converted |
| `lost` | Red | Lead lost or unresponsive |
| `archived` | Gray | Archived/inactive |

## API Integration

The dashboard connects to the NestJS backend via REST API:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/leads` | GET | List leads (supports `?status=`, `?limit=`, `?offset=`) |
| `/leads/:id` | GET | Get single lead |
| `/leads/:id/status` | PATCH | Update lead status |

API client is located in `src/lib/api.ts`.

## Styling

### HeroUI Theme

The dashboard uses a custom green "broccoli" theme defined in `hero.ts`:

- Primary color: `#22c55e` (green-500)
- Light/dark mode support
- Custom color scales for primary, success, warning, danger

### Tailwind CSS v4

Uses the new CSS-based configuration:

```css
/* globals.css */
@import "tailwindcss";
@plugin '../../hero.ts';
@source '../../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}';
@custom-variant dark (&:is(.dark *));
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm type-check` | Run TypeScript compiler check |
| `pnpm lint` | Lint with Biome |
| `pnpm format` | Format with Biome |

