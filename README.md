# ERP AI Mission Agent

Production-grade web application that turns a high-level ERP mission into a multi-step AI-driven execution flow with live progress and a final summary report.

## Core Capabilities

- Accepts a mission prompt such as:
  - "Reconcile today's gold stock across all branches"
  - "Generate payroll for all artisans this month"
- Uses Claude tool-use loops to:
  1. Generate an ordered mission plan
  2. Execute ERP steps sequentially
  3. Stream progress events to the frontend in real time
  4. Produce a final executive report

## Stack

- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui style components
- **Backend**: Next.js Route Handler API (`/api/missions/execute`)
- **AI Agent**: Anthropic Claude (`claude-sonnet-4-20250514`) with structured tool calling
- **State**: React `useReducer` + `useState`

## Project Structure

```txt
app/
  api/missions/execute/route.ts      # SSE mission execution API
  globals.css                        # Tailwind + design tokens
  layout.tsx                         # App metadata + shell
  page.tsx                           # Main mission console page

components/
  mission/mission-console.tsx        # Client UI, reducer, SSE consumption
  ui/                                # shadcn-style reusable UI components
    badge.tsx
    button.tsx
    card.tsx
    input.tsx
    progress.tsx
    scroll-area.tsx
    separator.tsx
    textarea.tsx

lib/
  agents/erp-mission-agent.ts        # Claude tool-use orchestration loop
  erp/
    finance.ts
    helpers.ts
    inventory.ts
    mock-data.ts
    payroll.ts
    tool-registry.ts                 # ERP tool definitions + execution
  types/
    erp.ts
    mission.ts
  sse.ts                             # SSE formatter
  utils.ts                           # cn() utility for class composition
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Then set:

   ```bash
   ANTHROPIC_API_KEY=your_real_key
   ```

3. Run the application:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

## API Contract

### `POST /api/missions/execute`

Request body:

```json
{
  "mission": "Reconcile today's gold stock across all branches"
}
```

Response:

- `text/event-stream`
- Streams structured mission events:
  - `mission_started`
  - `plan_created`
  - `step_started`
  - `step_completed`
  - `agent_note`
  - `mission_completed`
  - `mission_failed`

## Production Notes

- Route runs on **Node.js runtime** for Anthropic SDK compatibility.
- Includes structured input validation with `zod`.
- Limits agent turn-count to prevent runaway loops.
- All ERP operations are modularized for easy replacement with real ERP APIs.
