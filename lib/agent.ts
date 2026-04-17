import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, ToolResultBlockParam } from "@anthropic-ai/sdk/resources/messages";

import { executeTool, CLAUDE_TOOLS, type ToolName } from "@/lib/tools";
import type { MissionEvent } from "@/lib/types/mission";

const SYSTEM_PROMPT = `
You are the ERP AI Mission Agent for a jewellery ERP system.

Your job is to complete user missions by planning and then executing tool calls in sequence.

Operating rules:
1) First, break the mission into clear, ordered sub-steps in your own reasoning.
2) Use tools for any ERP data/action. Do not fabricate branch stock, payroll, work orders, invoices, or customer data.
3) You may call 3-8 tools (or more if needed) across multiple turns.
4) For each step, call exactly the most relevant tool with precise arguments.
5) After receiving each tool result, decide the next step and continue until mission is complete.
6) When all required work is done, return a final text response only (no tool call) in JSON with this shape:
{
  "executiveSummary": string,
  "completedSteps": string[],
  "outputs": string[],
  "risks": string[],
  "nextActions": string[]
}
7) Keep intermediate assistant text concise. Final response must be valid JSON only.
`;

function isoNow(): string {
  return new Date().toISOString();
}

function extractText(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join("\n");
}

export async function runAgent(params: {
  mission: string;
  onEvent: (event: MissionEvent) => Promise<void> | void;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing. Please set it in environment.");
  }

  const client = new Anthropic({ apiKey });
  const messages: MessageParam[] = [
    {
      role: "user",
      content: `Mission: ${params.mission}`,
    },
  ];

  await params.onEvent({
    type: "mission_started",
    timestamp: isoNow(),
    mission: params.mission,
  });

  for (let turn = 0; turn < 24; turn += 1) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      system: SYSTEM_PROMPT,
      max_tokens: 1400,
      temperature: 0.2,
      messages,
      tools: CLAUDE_TOOLS,
    });

    messages.push({
      role: "assistant",
      content: response.content,
    });

    const text = extractText(response.content);
    const toolUses = response.content.filter(
      (block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use",
    );

    if (toolUses.length === 0) {
      if (!text) {
        throw new Error("Agent ended without tool calls and without final text report.");
      }

      await params.onEvent({
        type: "mission_completed",
        timestamp: isoNow(),
        finalText: text,
      });
      return text;
    }

    if (text) {
      await params.onEvent({
        type: "agent_note",
        timestamp: isoNow(),
        note: text,
      });
    }

    const toolResults: ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      const toolName = toolUse.name as ToolName;
      const input = (toolUse.input as Record<string, unknown>) ?? {};

      await params.onEvent({
        type: "step_started",
        timestamp: isoNow(),
        stepName: toolName,
        input,
      });

      const output = await executeTool(toolName, input);

      await params.onEvent({
        type: "step_completed",
        timestamp: isoNow(),
        stepName: toolName,
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
  }

  throw new Error("Mission execution exceeded the maximum tool-use loop limit.");
}
