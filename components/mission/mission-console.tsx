"use client";

import { useMemo, useReducer, useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ListChecks,
  Loader2,
  PlayCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { MissionEvent, MissionStatus } from "@/lib/types/mission";

interface MissionUiState {
  status: MissionStatus;
  events: MissionEvent[];
  finalText: string | null;
  error: string | null;
}

type Action =
  | { type: "mission_start" }
  | { type: "ingest_event"; payload: MissionEvent }
  | { type: "mission_fail"; payload: string };

const INITIAL_STATE: MissionUiState = {
  status: "idle",
  events: [],
  finalText: null,
  error: null,
};

function missionReducer(state: MissionUiState, action: Action): MissionUiState {
  switch (action.type) {
    case "mission_start":
      return {
        ...INITIAL_STATE,
        status: "running",
      };
    case "mission_fail":
      return {
        ...state,
        status: "failed",
        error: action.payload,
      };
    case "ingest_event": {
      const event = action.payload;
      const nextEvents = [...state.events, event];

      if (event.type === "mission_completed") {
        return {
          ...state,
          events: nextEvents,
          status: "completed",
          finalText: event.finalText,
          error: null,
        };
      }

      if (event.type === "mission_failed") {
        return {
          ...state,
          events: nextEvents,
          status: "failed",
          error: event.error,
        };
      }

      return {
        ...state,
        events: nextEvents,
      };
    }
    default:
      return state;
  }
}

function isMissionEvent(input: unknown): input is MissionEvent {
  return (
    typeof input === "object" &&
    input !== null &&
    "type" in input &&
    "timestamp" in input
  );
}

async function streamMissionExecution(
  mission: string,
  onEvent: (event: MissionEvent) => void,
): Promise<void> {
  const response = await fetch("/api/missions/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mission }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Mission request failed.");
  }

  if (!response.body) {
    throw new Error("Mission stream was not returned by the server.");
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
      let eventName = "message";
      let data = "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          data += line.slice(5).trim();
        }
      }

      if (eventName !== "mission_update" || !data) {
        continue;
      }

      const parsed = JSON.parse(data) as unknown;
      if (isMissionEvent(parsed)) {
        onEvent(parsed);
      }
    }
  }
}

function statusBadgeVariant(
  status: MissionStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "running":
      return "secondary";
    case "completed":
      return "default";
    case "failed":
      return "destructive";
    case "idle":
    default:
      return "outline";
  }
}

export function MissionConsole(): React.JSX.Element {
  const [mission, setMission] = useState(
    "Reconcile today's gold stock across all branches and publish a summary report.",
  );
  const [state, dispatch] = useReducer(missionReducer, INITIAL_STATE);

  const progress = useMemo(() => {
    const startedSteps = state.events.filter((event) => event.type === "step_started").length;
    const completedSteps = state.events.filter((event) => event.type === "step_completed").length;

    if (state.status === "completed") {
      return 100;
    }
    if (startedSteps === 0) {
      return 0;
    }

    return Math.max(
      5,
      Math.min(95, Math.round((completedSteps / Math.max(startedSteps, 1)) * 100)),
    );
  }, [state.events, state.status]);

  const isRunning = state.status === "running";

  const handleRunMission = async (): Promise<void> => {
    if (!mission.trim() || isRunning) return;

    dispatch({ type: "mission_start" });
    try {
      await streamMissionExecution(mission.trim(), (event) =>
        dispatch({ type: "ingest_event", payload: event }),
      );
    } catch (error) {
      dispatch({
        type: "mission_fail",
        payload: error instanceof Error ? error.message : "Mission execution failed.",
      });
    }
  };

  return (
    <div className="container py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  ERP AI Mission Agent
                </CardTitle>
                <CardDescription>
                  Submit a high-level mission and monitor AI-driven ERP execution in
                  real time.
                </CardDescription>
              </div>
              <Badge variant={statusBadgeVariant(state.status)}>
                {state.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={4}
              value={mission}
              onChange={(event) => setMission(event.target.value)}
              placeholder="Generate payroll for all artisans this month and publish posting confirmation."
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleRunMission} disabled={isRunning || !mission.trim()}>
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing Mission
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Run Mission
                  </>
                )}
              </Button>
              <div className="min-w-[220px] flex-1">
                <Progress value={progress} />
                <p className="mt-1 text-xs text-muted-foreground">
                  Progress: {progress}% (
                  {state.events.filter((event) => event.type === "step_completed").length} tools
                  completed)
                </p>
              </div>
            </div>
            {state.error ? (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {state.error}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="min-h-[460px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListChecks className="h-5 w-5" />
                Tool Execution Steps
              </CardTitle>
              <CardDescription>
                Tool calls issued by Claude during the mission loop.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {state.events.filter((event) => event.type === "step_started").length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Tool execution steps will appear after mission initialization.
                </p>
              ) : (
                <ol className="space-y-4">
                  {state.events
                    .filter(
                      (event): event is Extract<MissionEvent, { type: "step_started" }> =>
                        event.type === "step_started",
                    )
                    .map((step, index) => (
                    <li key={`${step.timestamp}-${step.stepName}-${index}`} className="rounded-lg border p-3">
                      <p className="text-sm font-semibold">
                          {index + 1}. {step.stepName}
                      </p>
                      <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs">
                          {JSON.stringify(step.input, null, 2)}
                      </pre>
                    </li>
                    ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card className="min-h-[460px]">
            <CardHeader>
              <CardTitle className="text-lg">Live Execution Timeline</CardTitle>
              <CardDescription>
                Streaming updates from backend mission orchestration.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  {state.events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Runtime events will stream here.
                    </p>
                  ) : (
                    state.events.map((event, index) => (
                      <div key={`${event.timestamp}-${index}`} className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {event.type.replaceAll("_", " ")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          {event.type === "mission_completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : event.type === "mission_failed" ? (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          ) : event.type === "step_started" && isRunning ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
                          {JSON.stringify(event, null, 2)}
                        </pre>
                        <Separator />
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {state.finalText ? (
          <Card>
            <CardHeader>
              <CardTitle>Final Summary Report</CardTitle>
              <CardDescription>
                Structured executive output from the mission agent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
                {state.finalText}
              </pre>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
