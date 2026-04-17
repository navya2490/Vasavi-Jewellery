import { seededInt } from "@/lib/erp/helpers";

interface DateRangeInput {
  from: string;
  to: string;
}

const BRANCHES = ["Hyderabad", "Vijayawada", "Warangal", "Vizag"];

const ARTISANS = [
  { id: "A-101", name: "Ravi K", specialization: "Filigree" },
  { id: "A-102", name: "Suma R", specialization: "Casting" },
  { id: "A-103", name: "Imran S", specialization: "Polish" },
  { id: "A-104", name: "Kiran V", specialization: "Stone Setting" },
];

export async function getInventoryStatusHandler(input: {
  branch?: string;
  metal?: "gold" | "silver";
  purity?: string;
}): Promise<Record<string, unknown>> {
  const branches = input.branch ? [input.branch] : BRANCHES;
  const metal = input.metal ?? "gold";
  const purity = input.purity ?? (metal === "gold" ? "22K" : "999");

  const stock = branches.map((branch) => {
    const available = seededInt(`${branch}:${metal}:${purity}:available`, 1200, 6200);
    const reserved = seededInt(`${branch}:${metal}:${purity}:reserved`, 150, 900);
    const inTransit = seededInt(`${branch}:${metal}:${purity}:transit`, 80, 650);

    return {
      branch,
      metal,
      purity,
      available_grams: available,
      reserved_grams: reserved,
      in_transit_grams: inTransit,
      total_grams: available + reserved + inTransit,
    };
  });

  return {
    generated_at: new Date().toISOString(),
    filters: { branch: input.branch, metal, purity },
    stock,
  };
}

export async function createWorkOrderHandler(input: {
  artisan_id: string;
  metal_weight: number;
  purity: string;
  design_ref: string;
  due_date: string;
}): Promise<Record<string, unknown>> {
  const workOrderSuffix = seededInt(
    `${input.artisan_id}:${input.design_ref}:${input.due_date}`,
    10000,
    99999,
  );

  return {
    work_order_id: `WO-${workOrderSuffix}`,
    status: "created",
    artisan_id: input.artisan_id,
    metal_weight: input.metal_weight,
    purity: input.purity,
    design_ref: input.design_ref,
    due_date: input.due_date,
    created_at: new Date().toISOString(),
  };
}

export async function getWorkOrdersHandler(input: {
  status?: string;
  artisan_id?: string;
  date_range?: DateRangeInput;
}): Promise<Record<string, unknown>> {
  const filteredArtisans = input.artisan_id
    ? ARTISANS.filter((artisan) => artisan.id === input.artisan_id)
    : ARTISANS;

  const workOrders = filteredArtisans.map((artisan) => {
    const status = input.status ?? "in_progress";
    const quantity = seededInt(`${artisan.id}:${status}:qty`, 2, 9);

    return {
      work_order_id: `WO-${seededInt(`${artisan.id}:${status}`, 10000, 99999)}`,
      artisan_id: artisan.id,
      artisan_name: artisan.name,
      status,
      quantity,
      estimated_completion: input.date_range?.to ?? "2026-04-30",
    };
  });

  return {
    filters: input,
    total: workOrders.length,
    work_orders: workOrders,
  };
}

export async function calculatePayrollHandler(input: {
  month: string;
  year: number;
  employee_type?: "fixed" | "piece_rate";
}): Promise<Record<string, unknown>> {
  const employeeType = input.employee_type ?? "piece_rate";
  const employeeCount = employeeType === "fixed" ? 42 : 68;
  const grossPay = seededInt(`${input.month}:${input.year}:${employeeType}:gross`, 820000, 1460000);
  const deductions = seededInt(
    `${input.month}:${input.year}:${employeeType}:deductions`,
    90000,
    220000,
  );

  return {
    period: `${input.month}-${input.year}`,
    employee_type: employeeType,
    total_employees: employeeCount,
    gross_pay: grossPay,
    deductions,
    net_pay: grossPay - deductions,
    generated_at: new Date().toISOString(),
  };
}

export async function generateReportHandler(input: {
  report_type: "daily_stock" | "pl_summary" | "artisan_productivity" | "customer_aging";
  date_range: DateRangeInput;
}): Promise<Record<string, unknown>> {
  const rows =
    input.report_type === "daily_stock"
      ? BRANCHES.map((branch) => ({
          branch,
          opening: seededInt(`${branch}:${input.date_range.from}:opening`, 1800, 5000),
          closing: seededInt(`${branch}:${input.date_range.to}:closing`, 1500, 4900),
        }))
      : input.report_type === "artisan_productivity"
        ? ARTISANS.map((artisan) => ({
            artisan_id: artisan.id,
            artisan_name: artisan.name,
            units_completed: seededInt(`${artisan.id}:units:${input.date_range.to}`, 15, 58),
            avg_turnaround_days: seededInt(`${artisan.id}:tat:${input.date_range.to}`, 2, 7),
          }))
        : [
            {
              metric: "placeholder",
              value: seededInt(`${input.report_type}:${input.date_range.to}`, 100, 1000),
            },
          ];

  return {
    report_type: input.report_type,
    date_range: input.date_range,
    rows,
    generated_at: new Date().toISOString(),
  };
}

export async function reconcileStockHandler(input: {
  branch?: string;
  date: string;
}): Promise<Record<string, unknown>> {
  const branch = input.branch ?? "All Branches";
  const matchedLines = seededInt(`${branch}:${input.date}:matched`, 82, 146);
  const mismatchedLines = seededInt(`${branch}:${input.date}:mismatched`, 0, 14);
  const variance = seededInt(`${branch}:${input.date}:variance`, -28, 31);

  return {
    branch,
    date: input.date,
    matched_lines: matchedLines,
    mismatched_lines: mismatchedLines,
    variance_grams: variance,
    status: Math.abs(variance) <= 10 ? "balanced" : "review_required",
    reconciled_at: new Date().toISOString(),
  };
}

export async function getCustomerDataHandler(input: {
  segment?: string;
  last_visit_before?: string;
}): Promise<Record<string, unknown>> {
  const segment = input.segment ?? "all";
  const customers = Array.from({ length: 5 }).map((_, index) => ({
    customer_id: `CUST-${seededInt(`${segment}:${index}`, 1000, 9999)}`,
    name: `Customer ${index + 1}`,
    segment: segment === "all" ? (index % 2 === 0 ? "retail" : "wholesale") : segment,
    last_visit: input.last_visit_before ?? "2026-03-10",
    outstanding_amount: seededInt(`${segment}:${index}:outstanding`, 0, 220000),
  }));

  return {
    filters: input,
    total: customers.length,
    customers,
  };
}

export async function createInvoiceHandler(input: {
  customer_id: string;
  items: Array<{
    item_code?: string;
    description: string;
    qty: number;
    rate: number;
  }>;
  advance_applied?: number;
}): Promise<Record<string, unknown>> {
  const subTotal = input.items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const gst = Math.round(subTotal * 0.03);
  const advanceApplied = input.advance_applied ?? 0;
  const grandTotal = subTotal + gst - advanceApplied;

  return {
    invoice_id: `INV-${seededInt(`${input.customer_id}:${subTotal}`, 10000, 99999)}`,
    customer_id: input.customer_id,
    item_count: input.items.length,
    subtotal: subTotal,
    tax: gst,
    advance_applied: advanceApplied,
    grand_total: grandTotal,
    status: "issued",
    created_at: new Date().toISOString(),
  };
}
