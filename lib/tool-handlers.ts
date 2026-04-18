import {
  ERP_ARTISANS,
  ERP_BRANCHES,
  ERP_CUSTOMERS,
  ERP_INVENTORY,
  ERP_SALES_90_DAYS,
  ERP_WORK_ORDERS,
} from "@/lib/erp-mock";

interface DateRangeInput {
  from: string;
  to: string;
}

function inDateRange(date: string, range?: DateRangeInput): boolean {
  if (!range) return true;
  return date >= range.from && date <= range.to;
}

function toBranchName(branch?: string): string | undefined {
  if (!branch) return undefined;
  const directMatch = ERP_BRANCHES.find(
    (item) => item.id.toLowerCase() === branch.toLowerCase(),
  );
  if (directMatch) return directMatch.name;
  return branch;
}

function summarizeSales(range?: DateRangeInput): {
  gross: number;
  cogs: number;
  expense: number;
  net: number;
} {
  const scopedRows = ERP_SALES_90_DAYS.filter((row) => inDateRange(row.date, range));
  const gross = scopedRows.reduce((sum, row) => sum + row.grossSales, 0);
  const cogs = scopedRows.reduce((sum, row) => sum + row.cogs, 0);
  const expense = scopedRows.reduce((sum, row) => sum + row.operatingExpense, 0);
  const net = gross - cogs - expense;
  return { gross, cogs, expense, net };
}

export async function getInventoryStatusHandler(input: {
  branch?: string;
  metal?: "gold" | "silver";
  purity?: string;
}): Promise<Record<string, unknown>> {
  const metal = input.metal ?? "gold";
  const branchName = toBranchName(input.branch);

  const stock = ERP_INVENTORY.filter((row) => {
    if (row.metal !== metal) return false;
    if (branchName && row.branchName !== branchName) return false;
    if (input.purity && row.purity !== input.purity) return false;
    return true;
  }).map((row) => ({
    branch: row.branchName,
    metal: row.metal,
    purity: row.purity,
    available_grams: row.availableGrams,
    reserved_grams: row.reservedGrams,
    total_grams: row.availableGrams + row.reservedGrams,
  }));

  const totalGrams = stock.reduce((sum, row) => sum + row.total_grams, 0);

  return {
    generated_at: new Date().toISOString(),
    filters: { branch: input.branch, metal, purity: input.purity ?? "all" },
    stock,
    total_grams: totalGrams,
  };
}

export async function createWorkOrderHandler(input: {
  artisan_id: string;
  metal_weight: number;
  purity: string;
  design_ref: string;
  due_date: string;
}): Promise<Record<string, unknown>> {
  const workOrderSuffix = String(ERP_WORK_ORDERS.length + 22016).padStart(5, "0");
  const artisan = ERP_ARTISANS.find((item) => item.id === input.artisan_id);

  return {
    work_order_id: `WO-${workOrderSuffix}`,
    status: "created",
    artisan_id: input.artisan_id,
    artisan_name: artisan?.name ?? "Unknown Artisan",
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
  const workOrders = ERP_WORK_ORDERS.filter((order) => {
    if (input.status && order.status !== input.status) return false;
    if (input.artisan_id && order.artisanId !== input.artisan_id) return false;
    if (!inDateRange(order.dueDate, input.date_range)) return false;
    return true;
  }).map((order) => {
    const artisan = ERP_ARTISANS.find((item) => item.id === order.artisanId);
    const branch = ERP_BRANCHES.find((item) => item.id === order.branchId);
    return {
      work_order_id: order.id,
      artisan_id: order.artisanId,
      artisan_name: artisan?.name ?? "Unknown Artisan",
      branch: branch?.name ?? order.branchId,
      status: order.status,
      due_date: order.dueDate,
      metal: order.metal,
      purity: order.purity,
      design_ref: order.designRef,
      metal_weight: order.metalWeight,
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
  const employeeType = input.employee_type;
  const scopedArtisans = ERP_ARTISANS.filter((artisan) =>
    employeeType ? artisan.employeeType === employeeType : true,
  );

  const line_items = scopedArtisans.map((artisan) => {
    const historical = artisan.payrollHistory.find(
      (entry) =>
        entry.month.toLowerCase() === input.month.toLowerCase() && entry.year === input.year,
    );

    const gross = historical
      ? historical.payout
      : artisan.employeeType === "fixed"
        ? artisan.fixedMonthlySalary
        : Math.round(artisan.pieceRatePerGram * 120);

    const deduction = Math.round(gross * 0.06);

    return {
      artisan_id: artisan.id,
      artisan_name: artisan.name,
      employee_type: artisan.employeeType,
      specialization: artisan.specialization,
      gross,
      deduction,
      net: gross - deduction,
    };
  });

  const grossPay = line_items.reduce((sum, row) => sum + row.gross, 0);
  const deductions = line_items.reduce((sum, row) => sum + row.deduction, 0);

  return {
    period: `${input.month}-${input.year}`,
    employee_type: employeeType ?? "all",
    total_employees: line_items.length,
    gross_pay: grossPay,
    deductions,
    net_pay: grossPay - deductions,
    line_items,
    generated_at: new Date().toISOString(),
  };
}

export async function generateReportHandler(input: {
  report_type: "daily_stock" | "pl_summary" | "artisan_productivity" | "customer_aging";
  date_range: DateRangeInput;
}): Promise<Record<string, unknown>> {
  let rows: Array<Record<string, unknown>> = [];

  if (input.report_type === "daily_stock") {
    rows = ERP_BRANCHES.map((branch) => {
      const total = ERP_INVENTORY.filter(
        (row) => row.branchId === branch.id && row.metal === "gold",
      ).reduce((sum, row) => sum + row.availableGrams + row.reservedGrams, 0);

      return {
        branch: branch.name,
        total_gold_grams: total,
        purities: ERP_INVENTORY.filter(
          (row) => row.branchId === branch.id && row.metal === "gold",
        ).map((row) => ({ purity: row.purity, grams: row.availableGrams + row.reservedGrams })),
      };
    });
  } else if (input.report_type === "pl_summary") {
    const totals = summarizeSales(input.date_range);
    rows = [
      { metric: "gross_sales", value: totals.gross },
      { metric: "cogs", value: totals.cogs },
      { metric: "operating_expense", value: totals.expense },
      { metric: "net_profit", value: totals.net },
    ];
  } else if (input.report_type === "artisan_productivity") {
    rows = ERP_ARTISANS.map((artisan) => {
      const orders = ERP_WORK_ORDERS.filter((order) => order.artisanId === artisan.id);
      const completed = orders.filter((order) => order.status === "ready_dispatch").length;
      const active = orders.filter((order) => order.status === "in_progress").length;
      return {
        artisan_id: artisan.id,
        artisan_name: artisan.name,
        specialization: artisan.specialization,
        active_orders: active,
        completed_orders: completed,
      };
    });
  } else {
    rows = ERP_CUSTOMERS.map((customer) => ({
      customer_id: customer.id,
      name: customer.name,
      segment: customer.segment,
      last_visit: customer.lastVisit,
      outstanding_amount: customer.outstandingAmount,
      aging_bucket:
        customer.outstandingAmount === 0
          ? "current"
          : customer.outstandingAmount > 100000
            ? "90+ days"
            : "30-60 days",
    }));
  }

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
  const branchName = toBranchName(input.branch);
  const scopedInventory = ERP_INVENTORY.filter(
    (row) => row.metal === "gold" && (!branchName || row.branchName === branchName),
  );

  const expected = scopedInventory.reduce(
    (sum, row) => sum + row.availableGrams + row.reservedGrams,
    0,
  );
  const counted = Math.round((expected - 3 + (expected % 5)) * 100) / 100;
  const variance = Math.round((counted - expected) * 100) / 100;
  const mismatchedLines = scopedInventory.filter(
    (row) => Math.abs((row.availableGrams % 7) - 3) > 2,
  ).length;
  const matchedLines = scopedInventory.length - mismatchedLines;

  return {
    branch: branchName ?? "All Branches",
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
  const customers = ERP_CUSTOMERS.filter((customer) => {
    if (input.segment && customer.segment !== input.segment) return false;
    if (input.last_visit_before && !(customer.lastVisit < input.last_visit_before)) return false;
    return true;
  }).map((customer) => ({
    customer_id: customer.id,
    name: customer.name,
    segment: customer.segment,
    last_visit: customer.lastVisit,
    outstanding_amount: customer.outstandingAmount,
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
  const customer = ERP_CUSTOMERS.find((item) => item.id === input.customer_id);
  const subTotal = input.items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const gst = Math.round(subTotal * 0.03 * 100) / 100;
  const advanceApplied = input.advance_applied ?? 0;
  const grandTotal = Math.round((subTotal + gst - advanceApplied) * 100) / 100;
  const invoiceId = `INV-${Date.now().toString().slice(-6)}`;

  return {
    invoice_id: invoiceId,
    customer_id: input.customer_id,
    customer_name: customer?.name ?? "Unknown Customer",
    item_count: input.items.length,
    subtotal: subTotal,
    tax: gst,
    advance_applied: advanceApplied,
    grand_total: grandTotal,
    status: "issued",
    created_at: new Date().toISOString(),
  };
}
