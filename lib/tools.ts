import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import {
  calculatePayrollHandler,
  createInvoiceHandler,
  createWorkOrderHandler,
  generateReportHandler,
  getCustomerDataHandler,
  getInventoryStatusHandler,
  getWorkOrdersHandler,
  reconcileStockHandler,
} from "@/lib/tool-handlers";

const DateRangeSchema = z
  .object({
    from: z.string().min(8),
    to: z.string().min(8),
  })
  .strict();

const InvoiceItemSchema = z
  .object({
    item_code: z.string().min(2).optional(),
    description: z.string().min(2),
    qty: z.number().positive(),
    rate: z.number().positive(),
  })
  .strict();

const GetInventoryStatusSchema = z
  .object({
    branch: z.string().min(2).optional(),
    metal: z.enum(["gold", "silver"]).optional(),
    purity: z.string().min(2).optional(),
  })
  .strict();

const CreateWorkOrderSchema = z
  .object({
    artisan_id: z.string().min(2),
    metal_weight: z.number().positive(),
    purity: z.string().min(2),
    design_ref: z.string().min(2),
    due_date: z.string().min(8),
  })
  .strict();

const GetWorkOrdersSchema = z
  .object({
    status: z.string().min(2).optional(),
    artisan_id: z.string().min(2).optional(),
    date_range: DateRangeSchema.optional(),
  })
  .strict();

const CalculatePayrollSchema = z
  .object({
    month: z.string().min(3),
    year: z.number().int().min(2000).max(2100),
    employee_type: z.enum(["fixed", "piece_rate"]).optional(),
  })
  .strict();

const GenerateReportSchema = z
  .object({
    report_type: z.enum([
      "daily_stock",
      "pl_summary",
      "artisan_productivity",
      "customer_aging",
    ]),
    date_range: DateRangeSchema,
  })
  .strict();

const ReconcileStockSchema = z
  .object({
    branch: z.string().min(2).optional(),
    date: z.string().min(8),
  })
  .strict();

const GetCustomerDataSchema = z
  .object({
    segment: z.string().min(2).optional(),
    last_visit_before: z.string().min(8).optional(),
  })
  .strict();

const CreateInvoiceSchema = z
  .object({
    customer_id: z.string().min(2),
    items: z.array(InvoiceItemSchema).min(1),
    advance_applied: z.number().min(0).optional(),
  })
  .strict();

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "get_inventory_status",
    description:
      "Fetch inventory stock levels filtered by branch/metal/purity for mission planning and reconciliation.",
    input_schema: {
      type: "object",
      properties: {
        branch: { type: "string" },
        metal: { type: "string", enum: ["gold", "silver"] },
        purity: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "create_work_order",
    description: "Create a new artisan work order for jewellery production.",
    input_schema: {
      type: "object",
      properties: {
        artisan_id: { type: "string" },
        metal_weight: { type: "number" },
        purity: { type: "string" },
        design_ref: { type: "string" },
        due_date: { type: "string" },
      },
      required: ["artisan_id", "metal_weight", "purity", "design_ref", "due_date"],
      additionalProperties: false,
    },
  },
  {
    name: "get_work_orders",
    description:
      "Retrieve work orders, optionally filtered by status, artisan, and date range.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string" },
        artisan_id: { type: "string" },
        date_range: {
          type: "object",
          properties: {
            from: { type: "string" },
            to: { type: "string" },
          },
          required: ["from", "to"],
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "calculate_payroll",
    description:
      "Calculate payroll summary for fixed or piece-rate employees for a given month/year.",
    input_schema: {
      type: "object",
      properties: {
        month: { type: "string" },
        year: { type: "number" },
        employee_type: { type: "string", enum: ["fixed", "piece_rate"] },
      },
      required: ["month", "year"],
      additionalProperties: false,
    },
  },
  {
    name: "generate_report",
    description: "Generate operational or financial reports for a date range.",
    input_schema: {
      type: "object",
      properties: {
        report_type: {
          type: "string",
          enum: [
            "daily_stock",
            "pl_summary",
            "artisan_productivity",
            "customer_aging",
          ],
        },
        date_range: {
          type: "object",
          properties: {
            from: { type: "string" },
            to: { type: "string" },
          },
          required: ["from", "to"],
          additionalProperties: false,
        },
      },
      required: ["report_type", "date_range"],
      additionalProperties: false,
    },
  },
  {
    name: "reconcile_stock",
    description:
      "Run branch stock reconciliation for a target date and identify variances.",
    input_schema: {
      type: "object",
      properties: {
        branch: { type: "string" },
        date: { type: "string" },
      },
      required: ["date"],
      additionalProperties: false,
    },
  },
  {
    name: "get_customer_data",
    description:
      "Fetch customer list by segment or last-visit cutoff for collections and retention workflows.",
    input_schema: {
      type: "object",
      properties: {
        segment: { type: "string" },
        last_visit_before: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "create_invoice",
    description: "Create a sales invoice for a customer with optional advance application.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item_code: { type: "string" },
              description: { type: "string" },
              qty: { type: "number" },
              rate: { type: "number" },
            },
            required: ["description", "qty", "rate"],
            additionalProperties: false,
          },
        },
        advance_applied: { type: "number" },
      },
      required: ["customer_id", "items"],
      additionalProperties: false,
    },
  },
];

export type ToolName = (typeof TOOL_DEFINITIONS)[number]["name"];

export async function executeToolByName(
  toolName: string,
  rawInput: unknown,
): Promise<Record<string, unknown>> {
  switch (toolName) {
    case "get_inventory_status":
      return getInventoryStatusHandler(GetInventoryStatusSchema.parse(rawInput));
    case "create_work_order":
      return createWorkOrderHandler(CreateWorkOrderSchema.parse(rawInput));
    case "get_work_orders":
      return getWorkOrdersHandler(GetWorkOrdersSchema.parse(rawInput));
    case "calculate_payroll":
      return calculatePayrollHandler(CalculatePayrollSchema.parse(rawInput));
    case "generate_report":
      return generateReportHandler(GenerateReportSchema.parse(rawInput));
    case "reconcile_stock":
      return reconcileStockHandler(ReconcileStockSchema.parse(rawInput));
    case "get_customer_data":
      return getCustomerDataHandler(GetCustomerDataSchema.parse(rawInput));
    case "create_invoice":
      return createInvoiceHandler(CreateInvoiceSchema.parse(rawInput));
    default:
      throw new Error(`Unsupported tool call: ${toolName}`);
  }
}

// Backward-compatible alias for older imports.
export const CLAUDE_TOOLS = TOOL_DEFINITIONS;
export const executeTool = executeToolByName;
