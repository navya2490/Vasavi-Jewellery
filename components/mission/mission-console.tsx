"use client";

import { useMemo, useReducer, useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  PlayCircle,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const EXAMPLE_MISSIONS = [
  "Reconcile today's gold stock across Main Showroom and flag any variance",
  "Show all overdue work orders and identify which artisans are blocked",
  "Run April 2026 payroll for all piece-rate artisans and summarise net pay",
  "Generate a P&L summary for the last 30 days and highlight net profit",
];

type StepStatus = "pending" | "running" | "done" | "error";

interface PlanStep {
  step: number;
  tool: string;
  toolLabel: string;
  status: StepStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  outputSummary?: string;
  error?: string;
}

interface FinalAnswerPayload {
  summary: string;
  metrics: Array<{ label: string; value: string; positive?: boolean }>;
  stepsExecuted: number;
}

type AgentUiEvent =
  | {
      type: "plan_step";
      payload: {
        step: number;
        tool: string;
        toolLabel: string;
        status: "pending" | "running";
        input: Record<string, unknown>;
      };
    }
  | {
      type: "tool_result";
      payload: {
        step: number;
        tool: string;
        toolLabel: string;
        status: "done" | "error";
        input: Record<string, unknown>;
        outputSummary: string;
        output?: Record<string, unknown>;
        error?: string;
      };
    }
  | {
      type: "final_answer";
      payload: FinalAnswerPayload;
    };

interface MissionUiState {
  status: "idle" | "running" | "completed" | "failed";
  steps: PlanStep[];
  finalAnswer: FinalAnswerPayload | null;
  error: string | null;
}

type Action =
  | { type: "mission_start" }
  | { type: "ingest_event"; payload: AgentUiEvent }
  | { type: "mission_fail"; payload: string }
  | { type: "mission_reset" };

const INITIAL_STATE: MissionUiState = {
  status: "idle",
  steps: [],
  finalAnswer: null,
  error: null,
};

function upsertStep(steps: PlanStep[], incoming: PlanStep): PlanStep[] {
  const existingIndex = steps.findIndex((step) => step.step === incoming.step);
  if (existingIndex === -1) {
    return [...steps, incoming].sort((a, b) => a.step - b.step);
  }

  const nextSteps = [...steps];
  nextSteps[existingIndex] = { ...nextSteps[existingIndex], ...incoming };
  return nextSteps;
}

function missionReducer(state: MissionUiState, action: Action): MissionUiState {
  switch (action.type) {
    case "mission_start":
      return { ...INITIAL_STATE, status: "running" };
    case "mission_fail":
      return { ...state, status: "failed", error: action.payload };
    case "mission_reset":
      return INITIAL_STATE;
    case "ingest_event": {
      const event = action.payload;
      if (event.type === "plan_step") {
        return {
          ...state,
          steps: upsertStep(state.steps, {
            step: event.payload.step,
            tool: event.payload.tool,
            toolLabel: event.payload.toolLabel,
            status: event.payload.status,
            input: event.payload.input,
          }),
        };
      }

      if (event.type === "tool_result") {
        return {
          ...state,
          steps: upsertStep(state.steps, {
            step: event.payload.step,
            tool: event.payload.tool,
            toolLabel: event.payload.toolLabel,
            status: event.payload.status,
            input: event.payload.input,
            outputSummary: event.payload.outputSummary,
            output: event.payload.output,
            error: event.payload.error,
          }),
        };
      }

      if (event.type === "final_answer") {
        return {
          ...state,
          status: "completed",
          finalAnswer: event.payload,
          error: null,
        };
      }

      return state;
    }
    default:
      return state;
  }
}

function isAgentUiEvent(value: unknown): value is AgentUiEvent {
  return typeof value === "object" && value !== null && "type" in value && "payload" in value;
}

async function streamAgentExecution(
  mission: string,
  onEvent: (event: AgentUiEvent) => void,
): Promise<void> {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mission }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Mission request failed");
  }

  if (!response.body) {
    throw new Error("Streaming response body is not available.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const lines = frame.split("\n");
      let eventName = "";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        if (line.startsWith("data:")) data += line.slice(5).trim();
      }

      if (eventName !== "agent_event" || !data) continue;

      const parsed = JSON.parse(data) as unknown;
      if (isAgentUiEvent(parsed)) onEvent(parsed);
    }
  }
}

function StepDetails({ step }: { step: PlanStep }): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-6 w-6 rounded-full border border-slate-600 bg-slate-900 text-center text-xs leading-6 text-slate-300">
            {step.step}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">{step.toolLabel}</p>
            <p className="text-xs text-slate-400">{step.tool}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {step.status === "running" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-1 text-[11px] font-medium text-cyan-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
              Running
            </span>
          ) : null}
          {step.status === "pending" ? (
            <span className="inline-flex rounded-full border border-slate-500/40 px-2 py-1 text-[11px] text-slate-300">
              Pending
            </span>
          ) : null}
          {step.status === "done" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Done
            </span>
          ) : null}
          {step.status === "error" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-400/40 bg-red-500/10 px-2 py-1 text-[11px] text-red-300">
              <XCircle className="h-3.5 w-3.5" />
              Error
            </span>
          ) : null}
        </div>
      </div>

      {(step.status === "done" || step.status === "error") && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-slate-300">
            {step.error ? `Error: ${step.error}` : step.outputSummary}
          </p>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
          >
            {open ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Hide params/output
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Show params/output
              </>
            )}
          </button>
          {open ? (
            <div className="grid gap-2 rounded-md border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-300">
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">Input</p>
                <pre className="overflow-x-auto">{JSON.stringify(step.input, null, 2)}</pre>
              </div>
              <Separator className="bg-white/10" />
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">Output</p>
                <pre className="overflow-x-auto">{JSON.stringify(step.output ?? {}, null, 2)}</pre>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function MissionConsole(): React.JSX.Element {
  const [mission, setMission] = useState("");
  const [state, dispatch] = useReducer(missionReducer, INITIAL_STATE);

  const progress = useMemo(() => {
    if (state.status === "completed") return 100;
    if (state.steps.length === 0) return 0;
    const done = state.steps.filter((step) => step.status === "done").length;
    return Math.max(8, Math.min(96, Math.round((done / state.steps.length) * 100)));
  }, [state.status, state.steps]);

  const isRunning = state.status === "running";

  const handleMissionRun = async (): Promise<void> => {
    if (!mission.trim() || isRunning) return;
    dispatch({ type: "mission_start" });

    try {
      await streamAgentExecution(mission.trim(), (event) =>
        dispatch({ type: "ingest_event", payload: event }),
      );
    } catch (error) {
      dispatch({
        type: "mission_fail",
        payload: error instanceof Error ? error.message : "Mission execution failed.",
      });
    }
  };

  const handleReset = (): void => {
    dispatch({ type: "mission_reset" });
    setMission("");
  };

  return (
    <div className="min-h-screen bg-[#060a12] bg-[radial-gradient(circle_at_top_right,rgba(20,40,80,.25),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(13,88,90,.20),transparent_45%)] py-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 md:px-8">
        <Card className="border-white/10 bg-slate-950/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-slate-100">
              <Bot className="h-5 w-5 text-cyan-300" />
              ERP AI Mission Command Center
            </CardTitle>
            <CardDescription className="text-slate-400">
              Give your agent a mission and watch tool-by-tool execution in real time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={mission}
              onChange={(event) => setMission(event.target.value)}
              placeholder="Give your agent a mission..."
              rows={4}
              className="border-white/15 bg-slate-900/80 text-slate-100 placeholder:text-slate-500"
            />
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_MISSIONS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setMission(example)}
                  className="rounded-full border border-white/15 bg-slate-900 px-3 py-1 text-xs text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-200"
                >
                  {example}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleMissionRun}
                disabled={isRunning || !mission.trim()}
                className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Run Mission
                  </>
                )}
              </Button>
              <div className="min-w-[240px] flex-1">
                <Progress value={progress} className="bg-slate-800" />
                <p className="mt-1 text-xs text-slate-400">Execution progress: {progress}%</p>
              </div>
            </div>
            {state.error ? (
              <p className="flex items-center gap-2 text-sm text-red-300">
                <AlertCircle className="h-4 w-4" />
                {state.error}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/10 bg-slate-950/70">
            <CardHeader>
              <CardTitle className="text-slate-100">Execution Plan</CardTitle>
              <CardDescription className="text-slate-400">
                Plan appears as soon as Claude initiates tool calls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {state.steps.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Waiting for first tool call to build the execution plan.
                </p>
              ) : (
                <ScrollArea className="h-[420px] pr-3">
                  <div className="space-y-3">
                    {state.steps.map((step) => (
                      <StepDetails key={step.step} step={step} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-950/70">
            <CardHeader>
              <CardTitle className="text-slate-100">Result Panel</CardTitle>
              <CardDescription className="text-slate-400">
                Final natural-language summary and key mission metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.finalAnswer ? (
                <>
                  <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-cyan-200">
                      <Sparkles className="h-4 w-4" />
                      Final Summary
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-100">
                      {state.finalAnswer.summary}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {state.finalAnswer.metrics.length === 0 ? (
                      <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-400 sm:col-span-2">
                        No highlighted metrics were produced in this mission.
                      </div>
                    ) : (
                      state.finalAnswer.metrics.map((metric) => (
                        <div
                          key={metric.label}
                          className="rounded-lg border border-white/10 bg-slate-900/60 p-3"
                        >
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            {metric.label}
                          </p>
                          <p
                            className={`mt-1 text-lg font-semibold ${
                              metric.positive === false ? "text-red-300" : "text-emerald-300"
                            }`}
                          >
                            {metric.value} {metric.positive === false ? "✗" : "✓"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="text-xs text-slate-400">
                    Steps executed: {state.finalAnswer.stepsExecuted}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="border-white/20 bg-transparent text-slate-200 hover:bg-slate-800"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Run Another Mission
                  </Button>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Final mission summary appears here after all tool steps complete.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
