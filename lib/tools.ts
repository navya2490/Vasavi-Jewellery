import type { Tool } from "@anthropic-ai/sdk/resources/messages";

const PURITY_ENUM = [
  "24K",
  "22K",
  "18K",
  "14K",
  "925 Silver",
  "999 Silver",
] as const;

const BRANCH_ENUM = ["Main Showroom", "Mall Outlet", "Workshop"] as const;

const GET_INVENTORY_STATUS_TOOL: Tool = {
  name: "get_inventory_status",
  description:
    "Fetch current stock levels for gold and silver inventory. Defaults to Main Showroom if branch is omitted, and all metals if metal type is omitted.",
  input_schema: {
    type: "object",
    properties: {
      branch: {
        type: "string",
        enum: [...BRANCH_ENUM],
        default: "Main Showroom",
      },
      metal: {
        type: "string",
        enum: ["gold", "silver", "all"],
        default: "all",
      },
      purity: {
        type: "string",
        enum: [...PURITY_ENUM],
      },
    },
    additionalProperties: false,
  },
};

const CREATE_WORK_ORDER_TOOL: Tool = {
  name: "create_work_order",
  description: "Create a new work order and assign it to an artisan.",
  input_schema: {
    type: "object",
    properties: {
      artisan_id: { type: "string" },
      metal_weight: {
        type: "number",
        description: "Metal weight in grams.",
      },
      purity: { type: "string", enum: [...PURITY_ENUM] },
      design_ref: { type: "string" },
      due_date: {
        type: "string",
        description: "ISO 8601 date.",
      },
      wastage_tolerance_pct: {
        type: "number",
        description: "Allowed wastage percentage (e.g. 2.5).",
      },
    },
    required: [
      "artisan_id",
      "metal_weight",
      "purity",
      "design_ref",
      "due_date",
      "wastage_tolerance_pct",
    ],
    additionalProperties: false,
  },
};

const GET_WORK_ORDERS_TOOL: Tool = {
  name: "get_work_orders",
  description:
    "Retrieve work orders with optional filters. Overdue is auto-computed server-side.",
  input_schema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: [
          "queued",
          "in_progress",
          "quality_check",
          "completed",
          "delayed",
          "cancelled",
        ],
      },
      artisan_id: { type: "string" },
      overdue_only: { type: "boolean" },
      date_range: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: "ISO date.",
          },
          to: {
            type: "string",
            description: "ISO date.",
          },
        },
        required: ["from", "to"],
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
};

const CALCULATE_PAYROLL_TOOL: Tool = {
  name: "calculate_payroll",
  description:
    "Calculate payroll for a given month. Piece-rate formula: (units_completed × per_unit_rate) + 500 fixed_tool_allowance - advance_deduction - wastage_penalty. Wastage penalty applies only when wastage_pct exceeds the work order's wastage_tolerance_pct.",
  input_schema: {
    type: "object",
    properties: {
      month: {
        type: "number",
        minimum: 1,
        maximum: 12,
      },
      year: { type: "number" },
      employee_type: {
        type: "string",
        enum: ["fixed", "piece_rate", "all"],
        default: "all",
      },
    },
    required: ["month", "year"],
    additionalProperties: false,
  },
};

const GENERATE_REPORT_TOOL: Tool = {
  name: "generate_report",
  description:
    "Generate a structured ERP report. P&L formula: (Gross Sales - Discounts) = Net Sales; Net Sales - COGS (metal_cost + making_cost) - Operating Expenses = Net Profit. Making charges are revenue.",
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
          from: {
            type: "string",
            description: "ISO date.",
          },
          to: {
            type: "string",
            description: "ISO date.",
          },
        },
        required: ["from", "to"],
        additionalProperties: false,
      },
      branch: {
        type: "string",
        enum: ["Main Showroom", "Mall Outlet", "Workshop", "all"],
        default: "all",
      },
    },
    required: ["report_type", "date_range"],
    additionalProperties: false,
  },
};

const RECONCILE_STOCK_TOOL: Tool = {
  name: "reconcile_stock",
  description:
    "Reconcile physical stock against system records for a branch on a given date. Flags variances greater than 2 grams.",
  input_schema: {
    type: "object",
    properties: {
      branch: {
        type: "string",
        enum: [...BRANCH_ENUM],
        default: "Main Showroom",
      },
      date: {
        type: "string",
        description: "ISO date.",
      },
    },
    required: ["date"],
    additionalProperties: false,
  },
};

const GET_CUSTOMER_DATA_TOOL: Tool = {
  name: "get_customer_data",
  description:
    "Retrieve customer records with aging analysis. Aging buckets: 0–30 / 31–60 / 61–90 / 90+ days outstanding.",
  input_schema: {
    type: "object",
    properties: {
      segment: {
        type: "string",
        enum: ["vip", "regular", "new", "all"],
        default: "all",
      },
      aging_bucket: {
        type: "string",
        enum: ["0-30", "31-60", "61-90", "90+"],
      },
      last_visit_before: {
        type: "string",
        description: "ISO date.",
      },
    },
    additionalProperties: false,
  },
};

const CREATE_INVOICE_TOOL: Tool = {
  name: "create_invoice",
  description:
    "Create a sales invoice. GST model: split CGST 1.5% + SGST 1.5% (total 3%) applied to making charges only — metal value is GST-exempt per Indian jewelry trade norms. advance_applied is auto-capped at subtotal.",
  input_schema: {
    type: "object",
    properties: {
      customer_id: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            item_id: { type: "string" },
            description: { type: "string" },
            metal_value: { type: "number" },
            making_charge: { type: "number" },
            quantity: { type: "number" },
          },
          required: [
            "item_id",
            "description",
            "metal_value",
            "making_charge",
            "quantity",
          ],
          additionalProperties: false,
        },
      },
      advance_applied: { type: "number" },
    },
    required: ["customer_id", "items"],
    additionalProperties: false,
  },
};

export const TOOLS: Tool[] = [
  GET_INVENTORY_STATUS_TOOL,
  CREATE_WORK_ORDER_TOOL,
  GET_WORK_ORDERS_TOOL,
  CALCULATE_PAYROLL_TOOL,
  GENERATE_REPORT_TOOL,
  RECONCILE_STOCK_TOOL,
  GET_CUSTOMER_DATA_TOOL,
  CREATE_INVOICE_TOOL,
];

export type ToolName = (typeof TOOLS)[number]["name"];

// Backward-compatible aliases used by existing modules.
export const TOOL_DEFINITIONS = TOOLS;
export const CLAUDE_TOOLS = TOOLS;
export async function executeToolByName(
  toolName: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  void toolName;
  void input;
  throw new Error("executeToolByName is not implemented in /lib/tools.ts. Use API route tool router.");
}
export const executeTool = executeToolByName;
