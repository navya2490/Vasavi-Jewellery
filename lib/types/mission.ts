export type MissionStatus = "idle" | "running" | "completed" | "failed";

export interface MissionPlanStep {
  id: string;
  title: string;
  description: string;
  expectedTool?: string;
}

export interface MissionFinalReport {
  executiveSummary: string;
  completedSteps: string[];
  outputs: string[];
  risks: string[];
  nextActions: string[];
}

export type MissionEventType =
  | "mission_started"
  | "plan_created"
  | "step_started"
  | "step_completed"
  | "agent_note"
  | "mission_completed"
  | "mission_failed";

export interface MissionEventBase {
  type: MissionEventType;
  timestamp: string;
}

export interface MissionStartedEvent extends MissionEventBase {
  type: "mission_started";
  mission: string;
}

export interface PlanCreatedEvent extends MissionEventBase {
  type: "plan_created";
  plan: MissionPlanStep[];
}

export interface StepStartedEvent extends MissionEventBase {
  type: "step_started";
  stepName: string;
  input: Record<string, unknown>;
}

export interface StepCompletedEvent extends MissionEventBase {
  type: "step_completed";
  stepName: string;
  output: Record<string, unknown>;
}

export interface AgentNoteEvent extends MissionEventBase {
  type: "agent_note";
  note: string;
}

export interface MissionCompletedEvent extends MissionEventBase {
  type: "mission_completed";
  report: MissionFinalReport;
}

export interface MissionFailedEvent extends MissionEventBase {
  type: "mission_failed";
  error: string;
}

export type MissionEvent =
  | MissionStartedEvent
  | PlanCreatedEvent
  | StepStartedEvent
  | StepCompletedEvent
  | AgentNoteEvent
  | MissionCompletedEvent
  | MissionFailedEvent;

export interface MissionExecutionRequest {
  mission: string;
}
