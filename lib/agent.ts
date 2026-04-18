import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, ToolResultBlockParam } from "@anthropic-ai/sdk/resources/messages";

import { executeToolByName, TOOL_DEFINITIONS, type ToolName } from "@/lib/tools";

const SYSTEM_PROMPT = `
You are an ERP AI Mission Agent operating a jewelry business command center.
You convert high-level missions into precise operational actions.

Execution policy:
1) Always reason in steps, then call tools one-by-one.
2) Prefer concrete tool inputs with branch names, dates, purity, and artisan IDs when available.
3) Never invent ERP data; only rely on tool results.
4) Continue tool calls until the mission is complete.
5) Final response must be plain natural language summary with:
   - what was done,
   - key numbers,
   - any exceptions/risks,
   - recommended next action.
6) Keep non-final text concise.
`;

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export type AgentStreamEvent =
  | {
      type: "plan_step";
      payload: {
        step: number;
        tool: ToolName;
        toolLabel: string;
        status: "pending" | "running";
        input: Record<string, unknown>;
      };
    }
  | {
      type: "tool_result";
      payload: {
        step: number;
        tool: ToolName;
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
      payload: {
        summary: string;
        metrics: Array<{ label: string; value: string; positive?: boolean }>;
        stepsExecuted: number;
      };
    };

const TOOL_LABELS: Record<ToolName, string> = {
  get_inventory_status: "Get Inventory Status",
  create_work_order: "Create Work Order",
  get_work_orders: "Get Work Orders",
  calculate_payroll: "Calculate Payroll",
  generate_report: "Generate Report",
  reconcile_stock: "Reconcile Stock",
  get_customer_data: "Get Customer Data",
  create_invoice: "Create Invoice",
};

function extractText(content: Anthropic.Messages.ContentBlock[]): string | null {
  const text = content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join("\n");

  return text.length > 0 ? text : null;
}

function summarizeToolOutput(toolName: ToolName, output: Record<string, unknown>): string {
  switch (toolName) {
    case "get_inventory_status": {
      const total = Number(output.total_grams ?? 0);
      const lines = Array.isArray(output.stock) ? output.stock.length : 0;
      return `Fetched inventory across ${lines} stock lines (${total}g total).`;
    }
    case "create_work_order":
      return `Created work order ${String(output.work_order_id ?? "N/A")}.`;
    case "get_work_orders":
      return `Fetched ${Number(output.total ?? 0)} work orders.`;
    case "calculate_payroll":
      return `Calculated net payroll ${Number(output.net_pay ?? 0).toLocaleString()}.`;
    case "generate_report":
      return `Generated ${String(output.report_type ?? "report")} with ${Array.isArray(output.rows) ? output.rows.length : 0} rows.`;
    case "reconcile_stock":
      return `Reconciliation variance ${Number(output.variance_grams ?? 0)}g (${String(output.status ?? "unknown")}).`;
    case "get_customer_data":
      return `Fetched ${Number(output.total ?? 0)} customers.`;
    case "create_invoice":
      return `Created invoice ${String(output.invoice_id ?? "N/A")} for ${Number(output.grand_total ?? 0).toLocaleString()}.`;
    default:
      return "Tool completed successfully.";
  }
}

function collectMetricsFromOutput(
  toolName: ToolName,
  output: Record<string, unknown>,
): Array<{ label: string; value: string; positive?: boolean }> {
  switch (toolName) {
    case "get_inventory_status":
      return [
        {
          label: "Total Gold Stock",
          value: `${Number(output.total_grams ?? 0).toLocaleString()}g`,
          positive: true,
        },
      ];
    case "reconcile_stock": {
      const variance = Number(output.variance_grams ?? 0);
      return [
        {
          label: "Variance",
          value: `${variance > 0 ? "+" : ""}${variance}g`,
          positive: Math.abs(variance) <= 5,
        },
      ];
    }
    case "calculate_payroll":
      return [
        {
          label: "Net Payroll",
          value: Number(output.net_pay ?? 0).toLocaleString(),
          positive: true,
        },
      ];
    case "get_work_orders":
      return [
        {
          label: "Open Work Orders",
          value: String(output.total ?? 0),
          positive: true,
        },
      ];
    case "generate_report": {
      if (output.report_type === "pl_summary" && Array.isArray(output.rows)) {
        const netProfitRow = output.rows.find(
          (row) =>
            typeof row === "object" &&
            row !== null &&
            "metric" in row &&
            (row as { metric?: string }).metric === "net_profit",
        ) as { value?: number } | undefined;
        if (typeof netProfitRow?.value === "number") {
          return [
            {
              label: "Net Profit",
              value: netProfitRow.value.toLocaleString(),
              positive: netProfitRow.value >= 0,
            },
          ];
        }
      }
      return [];
    }
    default:
      return [];
  }
}

function dedupeMetrics(
  metrics: Array<{ label: string; value: string; positive?: boolean }>,
): Array<{ label: string; value: string; positive?: boolean }> {
  const seen = new Set<string>();
  return metrics.filter((metric) => {
    if (seen.has(metric.label)) return false;
    seen.add(metric.label);
    return true;
  });
}

function buildFallbackSummary(
  toolSummaries: string[],
  mission: string,
  stepsExecuted: number,
): string {
  const firstThree = toolSummaries.slice(0, 3).join(" ");
  return `Mission "${mission}" completed in ${stepsExecuted} tool steps. ${firstThree}`.trim();
}

function toClaudeMessages(history?: ConversationMessage[]): MessageParam[] {
  if (!history || history.length === 0) return [];
  return history
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

export async function runAgentLoop(params: {
  mission: string;
  conversationHistory?: ConversationMessage[];
  maxIterations?: number;
  onEvent: (event: AgentStreamEvent) => Promise<void> | void;
}): Promise<{
  finalText: string;
  metrics: Array<{ label: string; value: string; positive?: boolean }>;
  stepsExecuted: number;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing. Please set it in environment.");
  }

  const client = new Anthropic({ apiKey });
  const messages: MessageParam[] = [
    ...toClaudeMessages(params.conversationHistory),
    {
      role: "user",
      content: params.mission,
    },
  ];

  const maxIterations = params.maxIterations ?? 10;
  let stepCounter = 0;
  const collectedMetrics: Array<{ label: string; value: string; positive?: boolean }> = [];
  const collectedSummaries: string[] = [];

  for (let turn = 0; turn < maxIterations; turn += 1) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      system: SYSTEM_PROMPT,
      max_tokens: 1200,
      temperature: 0.2,
      messages,
      tools: TOOL_DEFINITIONS,
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
      const finalText = text ?? buildFallbackSummary(collectedSummaries, params.mission, stepCounter);
      const metrics = dedupeMetrics(collectedMetrics).slice(0, 4);

      await params.onEvent({
        type: "final_answer",
        payload: {
          summary: finalText,
          metrics,
          stepsExecuted: stepCounter,
        },
      });

      return {
        finalText,
        metrics,
        stepsExecuted: stepCounter,
      };
    }

    const toolResults: ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      stepCounter += 1;
      const toolName = toolUse.name as ToolName;
      const toolLabel = TOOL_LABELS[toolName] ?? toolName;
      const input = (toolUse.input as Record<string, unknown>) ?? {};

      await params.onEvent({
        type: "plan_step",
        payload: {
          step: stepCounter,
          tool: toolName,
          toolLabel,
          status: "pending",
          input,
        },
      });

      await params.onEvent({
        type: "plan_step",
        payload: {
          step: stepCounter,
          tool: toolName,
          toolLabel,
          status: "running",
          input,
        },
      });

      try {
        const output = await executeToolByName(toolName, input);
        const outputSummary = summarizeToolOutput(toolName, output);
        collectedSummaries.push(outputSummary);
        collectedMetrics.push(...collectMetricsFromOutput(toolName, output));

        await params.onEvent({
          type: "tool_result",
          payload: {
            step: stepCounter,
            tool: toolName,
            toolLabel,
            status: "done",
            input,
            outputSummary,
            output,
          },
        });

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(output),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Tool execution failed";
        await params.onEvent({
          type: "tool_result",
          payload: {
            step: stepCounter,
            tool: toolName,
            toolLabel,
            status: "error",
            input,
            outputSummary: errorMessage,
            error: errorMessage,
          },
        });
        throw error;
      }
    }

    messages.push({
      role: "user",
      content: toolResults,
    });
  }

  throw new Error("Safety limit reached: max 10 tool iterations exceeded.");
}

export async function runAgent(params: {
  mission: string;
  conversationHistory?: ConversationMessage[];
  maxIterations?: number;
  onEvent: (event: AgentStreamEvent) => Promise<void> | void;
}): Promise<string> {
  const result = await runAgentLoop(params);
  return result.finalText;
}

export function formatAgentEventForSse(event: AgentStreamEvent): string {
  return `event: agent_event\ndata: ${JSON.stringify(event)}\n\n`;
}
