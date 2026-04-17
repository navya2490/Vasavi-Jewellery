import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import {
  getLedgerSummary,
  publishMissionReport,
} from "@/lib/erp/finance";
import {
  getGoldStockSnapshot,
  listBranches,
  reconcileGoldStock,
} from "@/lib/erp/inventory";
import {
  calculateMonthlyPayroll,
  listArtisans,
  submitPayroll,
} from "@/lib/erp/payroll";

const InventorySnapshotInputSchema = z.object({
  branchId: z.string().min(1),
  date: z.string().min(4),
});

const InventoryReconcileInputSchema = z.object({
  date: z.string().min(4),
  toleranceGrams: z.number().positive().max(50).optional(),
});

const PayrollListInputSchema = z
  .object({
    branchId: z.string().optional(),
  })
  .optional();

const PayrollCalcInputSchema = z.object({
  month: z.string().min(4),
  includeIncentives: z.boolean().optional(),
});

const PayrollSubmitInputSchema = z.object({
  month: z.string().min(4),
  reviewer: z.string().min(2),
  totalNet: z.number().positive(),
});

const FinanceLedgerInputSchema = z.object({
  period: z.string().min(4),
});

const FinancePublishInputSchema = z.object({
  title: z.string().min(5),
  owner: z.string().min(2),
  highlights: z.array(z.string().min(2)).min(1),
});

export const ERP_TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "inventory_list_branches",
    description: "List all active jewellery branches.",
    input_schema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "inventory_get_gold_stock_snapshot",
    description:
      "Get opening/inward/outward/closing gold stock for a single branch and date.",
    input_schema: {
      type: "object",
      properties: {
        branchId: { type: "string" },
        date: { type: "string", description: "Use YYYY-MM-DD format." },
      },
      required: ["branchId", "date"],
      additionalProperties: false,
    },
  },
  {
    name: "inventory_reconcile_gold_stock",
    description:
      "Reconcile expected vs physically counted closing stock for all branches.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Use YYYY-MM-DD format." },
        toleranceGrams: { type: "number" },
      },
      required: ["date"],
      additionalProperties: false,
    },
  },
  {
    name: "payroll_list_artisans",
    description: "List artisans optionally filtered by branch.",
    input_schema: {
      type: "object",
      properties: {
        branchId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "payroll_calculate_monthly",
    description: "Compute monthly payroll line items for all artisans.",
    input_schema: {
      type: "object",
      properties: {
        month: { type: "string", description: "Use YYYY-MM format." },
        includeIncentives: { type: "boolean" },
      },
      required: ["month"],
      additionalProperties: false,
    },
  },
  {
    name: "payroll_submit_batch",
    description:
      "Submit payroll batch for posting once payroll totals are verified.",
    input_schema: {
      type: "object",
      properties: {
        month: { type: "string", description: "Use YYYY-MM format." },
        reviewer: { type: "string" },
        totalNet: { type: "number" },
      },
      required: ["month", "reviewer", "totalNet"],
      additionalProperties: false,
    },
  },
  {
    name: "finance_get_ledger_summary",
    description: "Get ledger summary values for a given period.",
    input_schema: {
      type: "object",
      properties: {
        period: { type: "string" },
      },
      required: ["period"],
      additionalProperties: false,
    },
  },
  {
    name: "finance_publish_mission_report",
    description: "Publish and persist mission highlights as a finance report artifact.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        owner: { type: "string" },
        highlights: { type: "array", items: { type: "string" } },
      },
      required: ["title", "owner", "highlights"],
      additionalProperties: false,
    },
  },
];

export type ErpToolName = (typeof ERP_TOOL_DEFINITIONS)[number]["name"];

function ensureToolName(toolName: string): asserts toolName is ErpToolName {
  if (!ERP_TOOL_DEFINITIONS.some((tool) => tool.name === toolName)) {
    throw new Error(`Unsupported ERP tool: ${toolName}`);
  }
}

export async function executeErpTool(
  toolName: string,
  input: unknown,
): Promise<Record<string, unknown>> {
  ensureToolName(toolName);

  switch (toolName) {
    case "inventory_list_branches":
      return { branches: await listBranches() };
    case "inventory_get_gold_stock_snapshot":
      return {
        snapshot: await getGoldStockSnapshot(InventorySnapshotInputSchema.parse(input)),
      };
    case "inventory_reconcile_gold_stock":
      return {
        reconciliation: await reconcileGoldStock(
          InventoryReconcileInputSchema.parse(input),
        ),
      };
    case "payroll_list_artisans":
      return {
        artisans: await listArtisans(PayrollListInputSchema.parse(input)),
      };
    case "payroll_calculate_monthly":
      return {
        payroll: await calculateMonthlyPayroll(PayrollCalcInputSchema.parse(input)),
      };
    case "payroll_submit_batch":
      return {
        submission: await submitPayroll(PayrollSubmitInputSchema.parse(input)),
      };
    case "finance_get_ledger_summary":
      return {
        ledger: await getLedgerSummary(FinanceLedgerInputSchema.parse(input)),
      };
    case "finance_publish_mission_report":
      return {
        report: await publishMissionReport(FinancePublishInputSchema.parse(input)),
      };
    default: {
      throw new Error(`Unhandled ERP tool: ${toolName}`);
    }
  }
}
