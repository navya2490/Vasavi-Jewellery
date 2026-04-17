# ERP AI Mission Agent

Production-grade mission command center for jewelry ERP operations.  
Users provide high-level missions, and Claude executes them via multi-turn tool calls with live streaming step updates.

## What You Get

- Dark command-center UI for mission input and live execution tracking
- Multi-turn agent loop with Claude tool-use
- Typed real-time stream from backend to frontend
- Mocked ERP tool APIs with realistic jewelry business data
- Final answer panel with key metrics and rerun flow

## Stack

- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind + shadcn-style components
- **Backend**: Next.js Route Handlers
- **AI**: Anthropic Claude (`claude-sonnet-4-20250514`)
- **State**: React `useState` + `useReducer`

## Main Routes

- `POST /api/agent`  
  Streaming agent endpoint for mission execution.

- `POST /api/tools/*`  
  Mock tool handlers for all ERP tools.

## Agent Stream Event Contract

`/api/agent` emits newline-delimited SSE events:

- `plan_step`
- `tool_result`
- `final_answer`

Payload shape:

```ts
{
  type: "plan_step" | "tool_result" | "final_answer",
  payload: object
}
```

## Environment Variables

Create `.env.local` from `.env.example` and set:

```bash
ANTHROPIC_API_KEY=your_real_key
```

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build & Quality

```bash
npm run typecheck
npm run lint
npm run build
```
