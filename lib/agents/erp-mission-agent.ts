import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, Tool, ToolResultBlockParam } from "@anthropic-ai/sdk/resources/messages";
import { z } from "zod";

import { executeErpTool, ERP_TOOL_DEFINITIONS } from "@/lib/erp/tool-registry";
import type {
  MissionEvent,
  MissionFinalReport,
  MissionPlanStep,
} from "@/lib/types/mission";

const PLAN_TOOL_NAME = "mission_create_plan";
const FINALIZE_TOOL_NAME = "mission_finalize_report";

const PlanSchema = z.object({
  steps: z
    .array(
      z.object({
        title: z.string().min(3),
        description: z.string().min(5),
        expectedTool: z.string().min(3).optional(),
      }),
    )
    .min(1)
    .max(12),
});

const FinalReportSchema = z.object({
  executiveSummary: z.string().min(10),
  completedSteps: z.array(z.string().min(3)).min(1),
  outputs: z.array(z.string().min(3)).min(1),
  risks: z.array(z.string().min(3)).default([]),
  nextActions: z.array(z.string().min(3)).default([]),
});

const CONTROL_TOOLS: Tool[] = [
  {
    name: PLAN_TOOL_NAME,
    description: "Create an ordered mission execution plan before running any ERP action.",
    input_schema: {
      type: "object",
      properties: {
        steps: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              expectedTool: { type: "string" },
            },
            required: ["title", "description"],
            additionalProperties: false,
          },
        },
      },
      required: ["steps"],
      additionalProperties: false,
    },
  },
  {
    name: FINALIZE_TOOL_NAME,
    description: "Publish a final executive report after all ERP steps are complete.",
    input_schema: {
      type: "object",
      properties: {
        executiveSummary: { type: "string" },
        completedSteps: { type: "array", items: { type: "string" } },
        outputs: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } },
        nextActions: { type: "array", items: { type: "string" } },
      },
      required: ["executiveSummary", "completedSteps", "outputs"],
      additionalProperties: false,
    },
  },
];

const SYSTEM_PROMPT = `
You are ERP AI Mission Agent.
Your job is to execute high-level ERP missions with deterministic tool-use.

Rules:
1) You MUST call "${PLAN_TOOL_NAME}" exactly once before calling any ERP tool.
2) Plan should contain ordered, concrete steps tied to ERP tools.
3) Execute steps sequentially; do not skip validation or reconciliation tasks.
4) Use only provided tools for data/actions. Never fabricate ERP results.
5) When complete, call "${FINALIZE_TOOL_NAME}" exactly once with concise executive report.
6) Keep text responses short. Use tool calls for actions.
`;

function isoNow(): string {
  return new Date().toISOString();
}

function textFromResponseBlocks(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join("\n");
}

function normalizePlan(rawPlan: z.infer<typeof PlanSchema>): MissionPlanStep[] {
  return rawPlan.steps.map((step, index) => ({
    id: `step-${index + 1}`,
    title: step.title,
    description: step.description,
    expectedTool: step.expectedTool,
  }));
}

export async function runMissionAgent(params: {
  mission: string;
  onEvent: (event: MissionEvent) => Promise<void> | void;
}): Promise<MissionFinalReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing. Please set it in environment.");
  }

  const client = new Anthropic({ apiKey });
  const tools: Tool[] = [...CONTROL_TOOLS, ...ERP_TOOL_DEFINITIONS];
  const messages: MessageParam[] = [
    {
      role: "user",
      content: `Mission: ${params.mission}`,
    },
  ];

  let finalReport: MissionFinalReport | null = null;
  let planPublished = false;
  let erpStepsExecuted = 0;

  await params.onEvent({
    type: "mission_started",
    timestamp: isoNow(),
    mission: params.mission,
  });

  for (let turn = 0; turn < 20; turn += 1) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1300,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages,
      tools,
    });

    messages.push({
      role: "assistant",
      content: response.content,
    });

    const note = textFromResponseBlocks(response.content);
    if (note) {
      await params.onEvent({
        type: "agent_note",
        timestamp: isoNow(),
        note,
      });
    }

    const toolUses = response.content.filter(
      (block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use",
    );

    if (toolUses.length === 0) {
      if (finalReport) {
        await params.onEvent({
          type: "mission_completed",
          timestamp: isoNow(),
          report: finalReport,
        });
        return finalReport;
      }
      throw new Error("Agent returned no tool calls and no final report.");
    }

    const toolResults: ToolResultBlockParam[] = [];

    for (const toolUse of toolUses) {
      await params.onEvent({
        type: "step_started",
        timestamp: isoNow(),
        stepName: toolUse.name,
        input: (toolUse.input as Record<string, unknown>) ?? {},
      });

      let output: Record<string, unknown>;

      if (toolUse.name === PLAN_TOOL_NAME) {
        const parsedPlan = PlanSchema.parse(toolUse.input);
        if (planPublished) {
          throw new Error("Plan was already created. Duplicate plan calls are not allowed.");
        }
        planPublished = true;
        const normalized = normalizePlan(parsedPlan);
        await params.onEvent({
          type: "plan_created",
          timestamp: isoNow(),
          plan: normalized,
        });
        output = {
          accepted: true,
          planSteps: normalized.length,
        };
      } else if (toolUse.name === FINALIZE_TOOL_NAME) {
        if (!planPublished) {
          throw new Error("Cannot finalize mission before a plan is created.");
        }
        if (erpStepsExecuted === 0) {
          throw new Error("Cannot finalize mission before executing ERP tools.");
        }
        finalReport = FinalReportSchema.parse(toolUse.input);
        output = {
          accepted: true,
        };
      } else {
        if (!planPublished) {
          throw new Error("Plan must be created before ERP tool execution.");
        }
        output = await executeErpTool(toolUse.name, toolUse.input);
        erpStepsExecuted += 1;
      }

      await params.onEvent({
        type: "step_completed",
        timestamp: isoNow(),
        stepName: toolUse.name,
        output,
      });

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(output),
      });
    }

    messages.push({
      role: "user",
      content: toolResults,
    });

    if (finalReport) {
      await params.onEvent({
        type: "mission_completed",
        timestamp: isoNow(),
        report: finalReport,
      });
      return finalReport;
    }
  }

  throw new Error("Mission execution exceeded max turns.");
}
