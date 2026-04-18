type BranchName = "Main Showroom" | "Mall Outlet" | "Workshop";
type MetalType = "gold" | "silver";
type Purity = "24K" | "22K" | "18K" | "14K" | "925 Silver" | "999 Silver";
type WorkOrderStatus =
  | "queued"
  | "in_progress"
  | "quality_check"
  | "completed"
  | "delayed"
  | "cancelled";
type CustomerSegment = "vip" | "regular" | "new";
type AgingBucket = "0-30" | "31-60" | "61-90" | "90+";
type EmployeeDepartment = "Sales" | "Accounts" | "Inventory" | "Admin" | "Security";

export interface InventoryRecord {
  branch: BranchName;
  purity: Purity;
  grams: number;
}

export interface ArtisanRecord {
  id: string;
  name: string;
  specialization: "necklace" | "bangles" | "rings" | "earrings" | "chains" | "studded";
  per_unit_rate: number;
  advance_balance: number;
  active: boolean;
}

export interface WorkOrderRecord {
  id: string;
  artisan_id: string;
  design_ref: string;
  metal_weight_g: number;
  purity: Purity;
  status: WorkOrderStatus;
  created_date: string;
  due_date: string;
  actual_completion_date: string | null;
  units_completed: number;
  wastage_g: number;
  wastage_tolerance_pct: number;
  photos: {
    issued_url: string;
    received_url: string | null;
  };
}

export interface EmployeeRecord {
  id: string;
  name: string;
  role: string;
  department: EmployeeDepartment;
  base_salary: number;
  pf_applicable: boolean;
  esi_applicable: boolean;
  advance_balance: number;
}

export interface SalesHistoryRecord {
  date: string;
  branch: BranchName;
  gross_sales_inr: number;
  discounts_inr: number;
  making_charges_inr: number;
  metal_cost_inr: number;
  operating_expenses_inr: number;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  segment: CustomerSegment;
  total_lifetime_value_inr: number;
  last_visit_date: string;
  outstanding_amount_inr: number;
  outstanding_since_date: string;
}

interface PieceRateHistory {
  artisan_id: string;
  month: number;
  year: number;
  units_completed: number;
}

interface MockDb {
  BRANCHES: BranchName[];
  INVENTORY: InventoryRecord[];
  ARTISANS: ArtisanRecord[];
  WORK_ORDERS: WorkOrderRecord[];
  EMPLOYEES: EmployeeRecord[];
  SALES_HISTORY: SalesHistoryRecord[];
  CUSTOMERS: CustomerRecord[];
  PIECE_RATE_HISTORY: PieceRateHistory[];
}

const SALES_START_DATE = new Date("2026-01-18T00:00:00.000Z");
const FESTIVAL_DATES = new Set<string>([
  "2026-01-26",
  "2026-02-14",
  "2026-03-18",
  "2026-04-14",
]);

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayDiff(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00.000Z`).getTime();
  const b = new Date(`${to}T00:00:00.000Z`).getTime();
  return Math.floor((b - a) / (24 * 60 * 60 * 1000));
}

function purityMetal(purity: Purity): MetalType {
  return purity.includes("Silver") ? "silver" : "gold";
}

function buildSalesHistory(): SalesHistoryRecord[] {
  const branches: BranchName[] = ["Main Showroom", "Mall Outlet", "Workshop"];
  const records: SalesHistoryRecord[] = [];

  for (let offset = 0; offset < 90; offset += 1) {
    const date = new Date(SALES_START_DATE);
    date.setUTCDate(SALES_START_DATE.getUTCDate() + offset);
    const dateStr = isoDate(date);
    const day = date.getUTCDay();
    const isWeekend = day === 0 || day === 6;
    const isFestival = FESTIVAL_DATES.has(dateStr);

    for (const branch of branches) {
      const branchFactor =
        branch === "Main Showroom" ? 1 : branch === "Mall Outlet" ? 0.72 : 0.58;
      const base = 120000 + ((offset * 1793 + branch.length * 641) % 240000);
      const weekendBoost = isWeekend ? 52000 : 0;
      const festivalBoost = isFestival ? 96000 : 0;
      const gross = Math.round((base + weekendBoost + festivalBoost) * branchFactor);
      const gross_sales_inr = Math.max(80000, Math.min(450000, gross));

      const discountPct = 0.01 + ((offset + branch.length) % 4) * 0.01;
      const makingPct = 0.08 + ((offset + branch.length * 3) % 5) * 0.01;
      const metalPct = 0.7 + ((offset + branch.length * 5) % 9) * 0.01;

      const discounts_inr = Math.round(gross_sales_inr * discountPct);
      const making_charges_inr = Math.round(gross_sales_inr * makingPct);
      const metal_cost_inr = Math.round(gross_sales_inr * metalPct);
      const operating_expenses_inr =
        8000 +
        ((offset * 977 + branch.length * 433) % 14000) +
        (branch === "Main Showroom" ? 900 : 0);

      records.push({
        date: dateStr,
        branch,
        gross_sales_inr,
        discounts_inr,
        making_charges_inr,
        metal_cost_inr,
        operating_expenses_inr,
      });
    }
  }

  return records;
}

export const MOCK_DB: MockDb = {
  BRANCHES: ["Main Showroom", "Mall Outlet", "Workshop"],
  INVENTORY: [
    { branch: "Main Showroom", purity: "22K", grams: 847 },
    { branch: "Main Showroom", purity: "18K", grams: 312 },
    { branch: "Main Showroom", purity: "14K", grams: 98 },
    { branch: "Main Showroom", purity: "925 Silver", grams: 2140 },
    { branch: "Main Showroom", purity: "999 Silver", grams: 560 },
    { branch: "Mall Outlet", purity: "22K", grams: 623 },
    { branch: "Mall Outlet", purity: "18K", grams: 215 },
    { branch: "Mall Outlet", purity: "925 Silver", grams: 1380 },
    { branch: "Workshop", purity: "24K", grams: 220 },
    { branch: "Workshop", purity: "22K", grams: 180 },
    { branch: "Workshop", purity: "999 Silver", grams: 890 },
  ],
  ARTISANS: [
    {
      id: "ART-001",
      name: "Ravi Kumar",
      specialization: "necklace",
      per_unit_rate: 320,
      advance_balance: 0,
      active: true,
    },
    {
      id: "ART-002",
      name: "Suma Reddy",
      specialization: "bangles",
      per_unit_rate: 190,
      advance_balance: 2000,
      active: true,
    },
    {
      id: "ART-003",
      name: "Imran Shaik",
      specialization: "rings",
      per_unit_rate: 125,
      advance_balance: 0,
      active: true,
    },
    {
      id: "ART-004",
      name: "Kiran Vemula",
      specialization: "earrings",
      per_unit_rate: 110,
      advance_balance: 0,
      active: true,
    },
    {
      id: "ART-005",
      name: "Prakash Jadhav",
      specialization: "chains",
      per_unit_rate: 85,
      advance_balance: 0,
      active: true,
    },
    {
      id: "ART-006",
      name: "Anita Paul",
      specialization: "studded",
      per_unit_rate: 340,
      advance_balance: 3500,
      active: true,
    },
    {
      id: "ART-007",
      name: "Yasmin Begum",
      specialization: "rings",
      per_unit_rate: 145,
      advance_balance: 0,
      active: true,
    },
    {
      id: "ART-008",
      name: "Manoj Gupta",
      specialization: "necklace",
      per_unit_rate: 275,
      advance_balance: 0,
      active: false,
    },
  ],
  WORK_ORDERS: [
    {
      id: "WO-3001",
      artisan_id: "ART-001",
      design_ref: "NECK-TRD-118",
      metal_weight_g: 64,
      purity: "22K",
      status: "queued",
      created_date: "2026-04-10",
      due_date: "2026-04-22",
      actual_completion_date: null,
      units_completed: 0,
      wastage_g: 1.1,
      wastage_tolerance_pct: 2.5,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3001-issued.jpg",
        received_url: null,
      },
    },
    {
      id: "WO-3002",
      artisan_id: "ART-002",
      design_ref: "BANG-CLS-992",
      metal_weight_g: 48,
      purity: "22K",
      status: "queued",
      created_date: "2026-04-09",
      due_date: "2026-04-21",
      actual_completion_date: null,
      units_completed: 0,
      wastage_g: 0.9,
      wastage_tolerance_pct: 2,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3002-issued.jpg",
        received_url: null,
      },
    },
    {
      id: "WO-3003",
      artisan_id: "ART-003",
      design_ref: "RING-SOL-014",
      metal_weight_g: 22,
      purity: "18K",
      status: "queued",
      created_date: "2026-04-11",
      due_date: "2026-04-23",
      actual_completion_date: null,
      units_completed: 0,
      wastage_g: 0.5,
      wastage_tolerance_pct: 2.2,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3003-issued.jpg",
        received_url: null,
      },
    },
    {
      id: "WO-3004",
      artisan_id: "ART-004",
      design_ref: "EARR-JUM-556",
      metal_weight_g: 18,
      purity: "14K",
      status: "queued",
      created_date: "2026-04-12",
      due_date: "2026-04-24",
      actual_completion_date: null,
      units_completed: 0,
      wastage_g: 0.4,
      wastage_tolerance_pct: 2,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3004-issued.jpg",
        received_url: null,
      },
    },
    {
      id: "WO-3005",
      artisan_id: "ART-005",
      design_ref: "CHAIN-FLT-301",
      metal_weight_g: 36,
      purity: "22K",
      status: "in_progress",
      created_date: "2026-04-06",
      due_date: "2026-04-15",
      actual_completion_date: null,
      units_completed: 4,
      wastage_g: 0.9,
      wastage_tolerance_pct: 2.5,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3005-issued.jpg",
        received_url: null,
      },
    },
    {
      id: "WO-3006",
      artisan_id: "ART-006",
      design_ref: "STUD-EMR-704",
      metal_weight_g: 28,
      purity: "18K",
      status: "in_progress",
      created_date: "2026-04-05",
      due_date: "2026-04-14",
      actual_completion_date: null,
      units_completed: 3,
      wastage_g: 0.7,
      wastage_tolerance_pct: 2.8,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3006-issued.jpg",
        received_url: null,
      },
    },
    {
      id: "WO-3007",
      artisan_id: "ART-007",
      design_ref: "RING-CLS-221",
      metal_weight_g: 20,
      purity: "22K",
      status: "in_progress",
      created_date: "2026-04-07",
      due_date: "2026-04-18",
      actual_completion_date: null,
      units_completed: 5,
      wastage_g: 0.4,
      wastage_tolerance_pct: 2.1,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3007-issued.jpg",
        received_url: null,
      },
    },
    {
      id: "WO-3008",
      artisan_id: "ART-001",
      design_ref: "NECK-ANT-909",
      metal_weight_g: 72,
      purity: "22K",
      status: "in_progress",
      created_date: "2026-04-08",
      due_date: "2026-04-25",
      actual_completion_date: null,
      units_completed: 2,
      wastage_g: 1.4,
      wastage_tolerance_pct: 2.4,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3008-issued.jpg",
        received_url: null,
      },
    },
    {
      id: "WO-3009",
      artisan_id: "ART-002",
      design_ref: "BANG-LUX-442",
      metal_weight_g: 44,
      purity: "22K",
      status: "quality_check",
      created_date: "2026-04-03",
      due_date: "2026-04-13",
      actual_completion_date: null,
      units_completed: 6,
      wastage_g: 1,
      wastage_tolerance_pct: 2,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3009-issued.jpg",
        received_url: "https://cdn.auric.local/orders/WO-3009-received.jpg",
      },
    },
    {
      id: "WO-3010",
      artisan_id: "ART-006",
      design_ref: "STUD-RBY-883",
      metal_weight_g: 30,
      purity: "18K",
      status: "quality_check",
      created_date: "2026-04-02",
      due_date: "2026-04-16",
      actual_completion_date: null,
      units_completed: 7,
      wastage_g: 0.8,
      wastage_tolerance_pct: 2.6,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3010-issued.jpg",
        received_url: "https://cdn.auric.local/orders/WO-3010-received.jpg",
      },
    },
    {
      id: "WO-3011",
      artisan_id: "ART-003",
      design_ref: "RING-DIA-102",
      metal_weight_g: 24,
      purity: "18K",
      status: "completed",
      created_date: "2026-03-28",
      due_date: "2026-04-08",
      actual_completion_date: "2026-04-08",
      units_completed: 10,
      wastage_g: 0.6,
      wastage_tolerance_pct: 2.2,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3011-issued.jpg",
        received_url: "https://cdn.auric.local/orders/WO-3011-received.jpg",
      },
    },
    {
      id: "WO-3012",
      artisan_id: "ART-004",
      design_ref: "EARR-PEA-615",
      metal_weight_g: 16,
      purity: "14K",
      status: "completed",
      created_date: "2026-03-30",
      due_date: "2026-04-09",
      actual_completion_date: "2026-04-09",
      units_completed: 12,
      wastage_g: 0.3,
      wastage_tolerance_pct: 1.8,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3012-issued.jpg",
        received_url: "https://cdn.auric.local/orders/WO-3012-received.jpg",
      },
    },
    {
      id: "WO-3013",
      artisan_id: "ART-005",
      design_ref: "CHAIN-HOL-710",
      metal_weight_g: 34,
      purity: "22K",
      status: "completed",
      created_date: "2026-03-31",
      due_date: "2026-04-10",
      actual_completion_date: "2026-04-10",
      units_completed: 8,
      wastage_g: 0.8,
      wastage_tolerance_pct: 2.5,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3013-issued.jpg",
        received_url: "https://cdn.auric.local/orders/WO-3013-received.jpg",
      },
    },
    {
      id: "WO-3014",
      artisan_id: "ART-001",
      design_ref: "NECK-WED-550",
      metal_weight_g: 66,
      purity: "22K",
      status: "delayed",
      created_date: "2026-04-01",
      due_date: "2026-04-12",
      actual_completion_date: null,
      units_completed: 1,
      wastage_g: 1.3,
      wastage_tolerance_pct: 2.3,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3014-issued.jpg",
        received_url: null,
      },
    },
    {
      id: "WO-3015",
      artisan_id: "ART-008",
      design_ref: "NECK-CTR-881",
      metal_weight_g: 58,
      purity: "18K",
      status: "cancelled",
      created_date: "2026-04-04",
      due_date: "2026-04-15",
      actual_completion_date: null,
      units_completed: 0,
      wastage_g: 0.9,
      wastage_tolerance_pct: 2.4,
      photos: {
        issued_url: "https://cdn.auric.local/orders/WO-3015-issued.jpg",
        received_url: null,
      },
    },
  ],
  EMPLOYEES: [
    {
      id: "EMP-001",
      name: "Lakshmi Devi",
      role: "Senior Sales Executive",
      department: "Sales",
      base_salary: 65000,
      pf_applicable: true,
      esi_applicable: false,
      advance_balance: 0,
    },
    {
      id: "EMP-002",
      name: "Raghav Reddy",
      role: "Sales Associate",
      department: "Sales",
      base_salary: 32000,
      pf_applicable: true,
      esi_applicable: false,
      advance_balance: 1200,
    },
    {
      id: "EMP-003",
      name: "Madhavi Iyer",
      role: "Store Cashier",
      department: "Accounts",
      base_salary: 29000,
      pf_applicable: true,
      esi_applicable: true,
      advance_balance: 0,
    },
    {
      id: "EMP-004",
      name: "Anand Goud",
      role: "Accounts Manager",
      department: "Accounts",
      base_salary: 58000,
      pf_applicable: true,
      esi_applicable: false,
      advance_balance: 0,
    },
    {
      id: "EMP-005",
      name: "Srinivas Murthy",
      role: "Inventory Controller",
      department: "Inventory",
      base_salary: 42000,
      pf_applicable: true,
      esi_applicable: false,
      advance_balance: 0,
    },
    {
      id: "EMP-006",
      name: "Pooja Nair",
      role: "Stock Auditor",
      department: "Inventory",
      base_salary: 36000,
      pf_applicable: true,
      esi_applicable: true,
      advance_balance: 2000,
    },
    {
      id: "EMP-007",
      name: "Tejaswini Rao",
      role: "HR Executive",
      department: "Admin",
      base_salary: 34000,
      pf_applicable: true,
      esi_applicable: true,
      advance_balance: 0,
    },
    {
      id: "EMP-008",
      name: "Girish Babu",
      role: "Branch Admin",
      department: "Admin",
      base_salary: 28000,
      pf_applicable: true,
      esi_applicable: true,
      advance_balance: 0,
    },
    {
      id: "EMP-009",
      name: "Manasa Rao",
      role: "Front Desk",
      department: "Admin",
      base_salary: 22000,
      pf_applicable: true,
      esi_applicable: true,
      advance_balance: 500,
    },
    {
      id: "EMP-010",
      name: "Ramesh Patil",
      role: "Security Lead",
      department: "Security",
      base_salary: 26000,
      pf_applicable: true,
      esi_applicable: true,
      advance_balance: 0,
    },
    {
      id: "EMP-011",
      name: "Sajid Khan",
      role: "Security Guard",
      department: "Security",
      base_salary: 18000,
      pf_applicable: true,
      esi_applicable: true,
      advance_balance: 0,
    },
    {
      id: "EMP-012",
      name: "Geetha Menon",
      role: "Operations Coordinator",
      department: "Inventory",
      base_salary: 39000,
      pf_applicable: true,
      esi_applicable: false,
      advance_balance: 0,
    },
  ],
  SALES_HISTORY: buildSalesHistory(),
  CUSTOMERS: [
    {
      id: "CUS-001",
      name: "Arjun Reddy",
      phone: "+919812340001",
      segment: "vip",
      total_lifetime_value_inr: 525000,
      last_visit_date: "2026-04-14",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-04-14",
    },
    {
      id: "CUS-002",
      name: "Sravya Koneru",
      phone: "+919812340002",
      segment: "vip",
      total_lifetime_value_inr: 418000,
      last_visit_date: "2026-04-09",
      outstanding_amount_inr: 18500,
      outstanding_since_date: "2026-03-28",
    },
    {
      id: "CUS-003",
      name: "Rajeshwari Gold",
      phone: "+919812340003",
      segment: "vip",
      total_lifetime_value_inr: 612000,
      last_visit_date: "2026-03-30",
      outstanding_amount_inr: 42000,
      outstanding_since_date: "2026-02-20",
    },
    {
      id: "CUS-004",
      name: "Nikhil Agarwal",
      phone: "+919812340004",
      segment: "vip",
      total_lifetime_value_inr: 275000,
      last_visit_date: "2026-03-22",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-22",
    },
    {
      id: "CUS-005",
      name: "Meera Soni",
      phone: "+919812340005",
      segment: "vip",
      total_lifetime_value_inr: 334000,
      last_visit_date: "2026-03-15",
      outstanding_amount_inr: 64000,
      outstanding_since_date: "2026-01-17",
    },
    {
      id: "CUS-006",
      name: "Vardhan Exports",
      phone: "+919812340006",
      segment: "vip",
      total_lifetime_value_inr: 840000,
      last_visit_date: "2026-04-08",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-04-08",
    },
    {
      id: "CUS-007",
      name: "Anika Jewels",
      phone: "+919812340007",
      segment: "vip",
      total_lifetime_value_inr: 295000,
      last_visit_date: "2026-03-25",
      outstanding_amount_inr: 7500,
      outstanding_since_date: "2026-04-02",
    },
    {
      id: "CUS-008",
      name: "Harsha B",
      phone: "+919812340008",
      segment: "vip",
      total_lifetime_value_inr: 226000,
      last_visit_date: "2026-03-11",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-11",
    },
    {
      id: "CUS-009",
      name: "Lakshmi Traders",
      phone: "+919812340009",
      segment: "vip",
      total_lifetime_value_inr: 702000,
      last_visit_date: "2026-02-27",
      outstanding_amount_inr: 85000,
      outstanding_since_date: "2026-01-12",
    },
    {
      id: "CUS-010",
      name: "Ritika Arora",
      phone: "+919812340010",
      segment: "vip",
      total_lifetime_value_inr: 241000,
      last_visit_date: "2026-03-20",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-20",
    },
    {
      id: "CUS-011",
      name: "Devika Rao",
      phone: "+919812340011",
      segment: "vip",
      total_lifetime_value_inr: 388000,
      last_visit_date: "2026-04-12",
      outstanding_amount_inr: 12000,
      outstanding_since_date: "2026-03-16",
    },
    {
      id: "CUS-012",
      name: "Prithvi Gems",
      phone: "+919812340012",
      segment: "vip",
      total_lifetime_value_inr: 457000,
      last_visit_date: "2026-02-24",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-02-24",
    },
    {
      id: "CUS-013",
      name: "Mohanlal Jain",
      phone: "+919812340013",
      segment: "vip",
      total_lifetime_value_inr: 319000,
      last_visit_date: "2026-03-09",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-09",
    },
    {
      id: "CUS-014",
      name: "Rupa Collections",
      phone: "+919812340014",
      segment: "vip",
      total_lifetime_value_inr: 267000,
      last_visit_date: "2026-03-31",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-31",
    },
    {
      id: "CUS-015",
      name: "Sandeep Modi",
      phone: "+919812340015",
      segment: "vip",
      total_lifetime_value_inr: 510000,
      last_visit_date: "2026-04-06",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-04-06",
    },
    {
      id: "CUS-016",
      name: "Karthik N",
      phone: "+919812340016",
      segment: "regular",
      total_lifetime_value_inr: 168000,
      last_visit_date: "2026-04-11",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-04-11",
    },
    {
      id: "CUS-017",
      name: "Sneha Varma",
      phone: "+919812340017",
      segment: "regular",
      total_lifetime_value_inr: 146000,
      last_visit_date: "2026-03-29",
      outstanding_amount_inr: 22000,
      outstanding_since_date: "2026-02-10",
    },
    {
      id: "CUS-018",
      name: "Avinash Rao",
      phone: "+919812340018",
      segment: "regular",
      total_lifetime_value_inr: 112000,
      last_visit_date: "2026-03-25",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-25",
    },
    {
      id: "CUS-019",
      name: "Harini K",
      phone: "+919812340019",
      segment: "regular",
      total_lifetime_value_inr: 92000,
      last_visit_date: "2026-03-19",
      outstanding_amount_inr: 6500,
      outstanding_since_date: "2026-03-28",
    },
    {
      id: "CUS-020",
      name: "Prasad Gupta",
      phone: "+919812340020",
      segment: "regular",
      total_lifetime_value_inr: 134000,
      last_visit_date: "2026-03-11",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-11",
    },
    {
      id: "CUS-021",
      name: "Vijaya Lakshmi",
      phone: "+919812340021",
      segment: "regular",
      total_lifetime_value_inr: 172000,
      last_visit_date: "2026-04-05",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-04-05",
    },
    {
      id: "CUS-022",
      name: "Satwik Jewels",
      phone: "+919812340022",
      segment: "regular",
      total_lifetime_value_inr: 196000,
      last_visit_date: "2026-03-30",
      outstanding_amount_inr: 31000,
      outstanding_since_date: "2026-01-28",
    },
    {
      id: "CUS-023",
      name: "Madhuri Patel",
      phone: "+919812340023",
      segment: "regular",
      total_lifetime_value_inr: 101000,
      last_visit_date: "2026-03-16",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-16",
    },
    {
      id: "CUS-024",
      name: "Rohan K",
      phone: "+919812340024",
      segment: "regular",
      total_lifetime_value_inr: 124000,
      last_visit_date: "2026-03-05",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-05",
    },
    {
      id: "CUS-025",
      name: "Padmaja S",
      phone: "+919812340025",
      segment: "regular",
      total_lifetime_value_inr: 143000,
      last_visit_date: "2026-03-09",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-09",
    },
    {
      id: "CUS-026",
      name: "Nithin C",
      phone: "+919812340026",
      segment: "regular",
      total_lifetime_value_inr: 119000,
      last_visit_date: "2026-03-27",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-27",
    },
    {
      id: "CUS-027",
      name: "Vasudha Jewellery",
      phone: "+919812340027",
      segment: "regular",
      total_lifetime_value_inr: 182000,
      last_visit_date: "2026-04-01",
      outstanding_amount_inr: 14000,
      outstanding_since_date: "2026-03-20",
    },
    {
      id: "CUS-028",
      name: "Tarun Raj",
      phone: "+919812340028",
      segment: "regular",
      total_lifetime_value_inr: 89000,
      last_visit_date: "2026-03-13",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-13",
    },
    {
      id: "CUS-029",
      name: "Pavani R",
      phone: "+919812340029",
      segment: "regular",
      total_lifetime_value_inr: 151000,
      last_visit_date: "2026-03-24",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-24",
    },
    {
      id: "CUS-030",
      name: "Jagadish P",
      phone: "+919812340030",
      segment: "regular",
      total_lifetime_value_inr: 98000,
      last_visit_date: "2026-02-26",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-02-26",
    },
    {
      id: "CUS-031",
      name: "Mithra Design House",
      phone: "+919812340031",
      segment: "regular",
      total_lifetime_value_inr: 177000,
      last_visit_date: "2026-04-07",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-04-07",
    },
    {
      id: "CUS-032",
      name: "Sowmya Fashions",
      phone: "+919812340032",
      segment: "regular",
      total_lifetime_value_inr: 109000,
      last_visit_date: "2026-03-18",
      outstanding_amount_inr: 9000,
      outstanding_since_date: "2026-02-22",
    },
    {
      id: "CUS-033",
      name: "Neha M",
      phone: "+919812340033",
      segment: "new",
      total_lifetime_value_inr: 36000,
      last_visit_date: "2026-04-13",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-04-13",
    },
    {
      id: "CUS-034",
      name: "Rahul V",
      phone: "+919812340034",
      segment: "new",
      total_lifetime_value_inr: 28000,
      last_visit_date: "2026-04-10",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-04-10",
    },
    {
      id: "CUS-035",
      name: "Veda Jewels",
      phone: "+919812340035",
      segment: "new",
      total_lifetime_value_inr: 41000,
      last_visit_date: "2026-04-04",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-04-04",
    },
    {
      id: "CUS-036",
      name: "Amit T",
      phone: "+919812340036",
      segment: "new",
      total_lifetime_value_inr: 22000,
      last_visit_date: "2026-03-29",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-29",
    },
    {
      id: "CUS-037",
      name: "Rachana B",
      phone: "+919812340037",
      segment: "new",
      total_lifetime_value_inr: 33000,
      last_visit_date: "2026-04-01",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-04-01",
    },
    {
      id: "CUS-038",
      name: "Bhavesh L",
      phone: "+919812340038",
      segment: "new",
      total_lifetime_value_inr: 47000,
      last_visit_date: "2026-03-26",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-26",
    },
    {
      id: "CUS-039",
      name: "Sia Boutique",
      phone: "+919812340039",
      segment: "new",
      total_lifetime_value_inr: 55000,
      last_visit_date: "2026-03-23",
      outstanding_amount_inr: 0,
      outstanding_since_date: "2026-03-23",
    },
    {
      id: "CUS-040",
      name: "Kavya P",
      phone: "+919812340040",
      segment: "new",
      total_lifetime_value_inr: 26000,
      last_visit_date: "2026-04-02",
      outstanding_amount_inr: 5000,
      outstanding_since_date: "2026-03-12",
    },
  ],
  PIECE_RATE_HISTORY: [
    { artisan_id: "ART-001", month: 3, year: 2026, units_completed: 26 },
    { artisan_id: "ART-002", month: 3, year: 2026, units_completed: 31 },
    { artisan_id: "ART-003", month: 3, year: 2026, units_completed: 48 },
    { artisan_id: "ART-004", month: 3, year: 2026, units_completed: 42 },
    { artisan_id: "ART-005", month: 3, year: 2026, units_completed: 37 },
    { artisan_id: "ART-006", month: 3, year: 2026, units_completed: 18 },
    { artisan_id: "ART-007", month: 3, year: 2026, units_completed: 44 },
    { artisan_id: "ART-008", month: 3, year: 2026, units_completed: 12 },
    { artisan_id: "ART-001", month: 4, year: 2026, units_completed: 19 },
    { artisan_id: "ART-002", month: 4, year: 2026, units_completed: 22 },
    { artisan_id: "ART-003", month: 4, year: 2026, units_completed: 34 },
    { artisan_id: "ART-004", month: 4, year: 2026, units_completed: 29 },
    { artisan_id: "ART-005", month: 4, year: 2026, units_completed: 26 },
    { artisan_id: "ART-006", month: 4, year: 2026, units_completed: 16 },
    { artisan_id: "ART-007", month: 4, year: 2026, units_completed: 32 },
    { artisan_id: "ART-008", month: 4, year: 2026, units_completed: 10 },
  ],
};

// TODO: Replace with real DB query
export async function getInventoryStatus(input: {
  branch?: BranchName;
  metal?: "gold" | "silver" | "all";
  purity?: Purity;
}): Promise<Record<string, unknown>> {
  const branch = input.branch ?? "Main Showroom";
  const metal = input.metal ?? "all";

  const stock = MOCK_DB.INVENTORY.filter((item) => {
    if (item.branch !== branch) return false;
    if (input.purity && item.purity !== input.purity) return false;
    if (metal === "all") return true;
    return purityMetal(item.purity) === metal;
  }).map((item) => ({
    branch: item.branch,
    purity: item.purity,
    metal: purityMetal(item.purity),
    grams: item.grams,
  }));

  return {
    branch,
    metal,
    purity: input.purity ?? "all",
    stock,
    total_grams: stock.reduce((sum, row) => sum + Number(row.grams), 0),
    generated_at: new Date().toISOString(),
  };
}

// TODO: Replace with real DB query
export async function createWorkOrder(input: {
  artisan_id: string;
  metal_weight: number;
  purity: Purity;
  design_ref: string;
  due_date: string;
  wastage_tolerance_pct: number;
}): Promise<Record<string, unknown>> {
  const nextId = `WO-${String(3000 + MOCK_DB.WORK_ORDERS.length + 1)}`;
  return {
    work_order_id: nextId,
    status: "queued",
    artisan_id: input.artisan_id,
    metal_weight_g: input.metal_weight,
    purity: input.purity,
    design_ref: input.design_ref,
    due_date: input.due_date,
    wastage_tolerance_pct: input.wastage_tolerance_pct,
    created_date: new Date().toISOString().slice(0, 10),
  };
}

// TODO: Replace with real DB query
export async function getWorkOrders(input: {
  status?: WorkOrderStatus;
  artisan_id?: string;
  overdue_only?: boolean;
  date_range?: { from: string; to: string };
}): Promise<Record<string, unknown>> {
  const today = new Date().toISOString().slice(0, 10);
  const records = MOCK_DB.WORK_ORDERS.filter((row) => {
    if (input.status && row.status !== input.status) return false;
    if (input.artisan_id && row.artisan_id !== input.artisan_id) return false;
    if (input.date_range && (row.created_date < input.date_range.from || row.created_date > input.date_range.to)) {
      return false;
    }
    if (input.overdue_only) {
      const overdue = row.due_date < today && row.status !== "completed" && row.status !== "cancelled";
      if (!overdue) return false;
    }
    return true;
  });

  return {
    total: records.length,
    overdue_count: records.filter(
      (row) => row.due_date < today && row.status !== "completed" && row.status !== "cancelled",
    ).length,
    work_orders: records,
  };
}

// TODO: Replace with real DB query
export async function calculatePayroll(input: {
  month: number;
  year: number;
  employee_type?: "fixed" | "piece_rate" | "all";
}): Promise<Record<string, unknown>> {
  const employeeType = input.employee_type ?? "all";
  const fixed = MOCK_DB.EMPLOYEES.map((emp) => ({
    id: emp.id,
    name: emp.name,
    employee_type: "fixed",
    gross: emp.base_salary,
    advance_deduction: emp.advance_balance > 0 ? Math.min(2000, emp.advance_balance) : 0,
  }));

  const piece = MOCK_DB.ARTISANS.filter((artisan) => artisan.active).map((artisan) => {
    const history =
      MOCK_DB.PIECE_RATE_HISTORY.find(
        (entry) =>
          entry.artisan_id === artisan.id &&
          entry.month === input.month &&
          entry.year === input.year,
      ) ?? {
        artisan_id: artisan.id,
        month: input.month,
        year: input.year,
        units_completed: 0,
      };

    const artisanOrders = MOCK_DB.WORK_ORDERS.filter(
      (order) =>
        order.artisan_id === artisan.id &&
        Number(order.created_date.slice(0, 4)) === input.year &&
        Number(order.created_date.slice(5, 7)) === input.month,
    );

    const wastagePenalty = artisanOrders.reduce((sum, order) => {
      const wastagePct = (order.wastage_g / order.metal_weight_g) * 100;
      if (wastagePct <= order.wastage_tolerance_pct) return sum;
      const excess = wastagePct - order.wastage_tolerance_pct;
      return sum + Math.round(excess * 100);
    }, 0);

    const advanceDeduction = artisan.advance_balance > 0 ? Math.min(1500, artisan.advance_balance) : 0;
    const gross = history.units_completed * artisan.per_unit_rate + 500;
    const net = gross - advanceDeduction - wastagePenalty;

    return {
      id: artisan.id,
      name: artisan.name,
      employee_type: "piece_rate",
      units_completed: history.units_completed,
      per_unit_rate: artisan.per_unit_rate,
      fixed_tool_allowance: 500,
      advance_deduction: advanceDeduction,
      wastage_penalty: wastagePenalty,
      gross,
      net,
    };
  });

  const employees =
    employeeType === "fixed" ? fixed : employeeType === "piece_rate" ? piece : [...fixed, ...piece];

  const total = employees.reduce((sum, row) => {
    if ("net" in row && typeof row.net === "number") {
      return sum + row.net;
    }
    return sum + row.gross;
  }, 0);

  return {
    month: input.month,
    year: input.year,
    employee_type: employeeType,
    total_employees: employees.length,
    net_pay: total,
    employees,
  };
}

// TODO: Replace with real DB query
export async function generateReport(input: {
  report_type: "daily_stock" | "pl_summary" | "artisan_productivity" | "customer_aging";
  date_range: { from: string; to: string };
  branch?: BranchName | "all";
}): Promise<Record<string, unknown>> {
  const branchFilter = input.branch ?? "all";

  if (input.report_type === "daily_stock") {
    const rows = MOCK_DB.BRANCHES.filter((branch) => branchFilter === "all" || branch === branchFilter).map(
      (branch) => {
        const branchStock = MOCK_DB.INVENTORY.filter((inv) => inv.branch === branch);
        return {
          branch,
          total_grams: branchStock.reduce((sum, inv) => sum + inv.grams, 0),
          stock: branchStock,
        };
      },
    );

    return { report_type: input.report_type, date_range: input.date_range, branch: branchFilter, rows };
  }

  if (input.report_type === "pl_summary") {
    const scoped = MOCK_DB.SALES_HISTORY.filter((row) => {
      if (branchFilter !== "all" && row.branch !== branchFilter) return false;
      return row.date >= input.date_range.from && row.date <= input.date_range.to;
    });

    const grossSales = scoped.reduce((sum, row) => sum + row.gross_sales_inr, 0);
    const discounts = scoped.reduce((sum, row) => sum + row.discounts_inr, 0);
    const making = scoped.reduce((sum, row) => sum + row.making_charges_inr, 0);
    const netSales = grossSales - discounts;
    const cogs = scoped.reduce((sum, row) => sum + row.metal_cost_inr + row.making_charges_inr, 0);
    const op = scoped.reduce((sum, row) => sum + row.operating_expenses_inr, 0);
    const netProfit = netSales - cogs - op;

    return {
      report_type: input.report_type,
      date_range: input.date_range,
      branch: branchFilter,
      rows: [
        { metric: "gross_sales", value: grossSales },
        { metric: "discounts", value: discounts },
        { metric: "net_sales", value: netSales },
        { metric: "cogs", value: cogs },
        { metric: "operating_expenses", value: op },
        { metric: "making_charges_revenue", value: making },
        { metric: "net_profit", value: netProfit },
      ],
    };
  }

  if (input.report_type === "artisan_productivity") {
    const rows = MOCK_DB.ARTISANS.map((artisan) => {
      const orders = MOCK_DB.WORK_ORDERS.filter(
        (row) =>
          row.artisan_id === artisan.id &&
          row.created_date >= input.date_range.from &&
          row.created_date <= input.date_range.to,
      );
      return {
        artisan_id: artisan.id,
        artisan_name: artisan.name,
        specialization: artisan.specialization,
        total_orders: orders.length,
        completed_orders: orders.filter((row) => row.status === "completed").length,
        units_completed: orders.reduce((sum, row) => sum + row.units_completed, 0),
      };
    });
    return { report_type: input.report_type, date_range: input.date_range, rows };
  }

  const today = new Date().toISOString().slice(0, 10);
  const rows = MOCK_DB.CUSTOMERS.map((customer) => {
    const days = dayDiff(customer.outstanding_since_date, today);
    const aging_bucket: AgingBucket =
      days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+";
    return {
      customer_id: customer.id,
      name: customer.name,
      segment: customer.segment,
      outstanding_amount_inr: customer.outstanding_amount_inr,
      aging_bucket,
    };
  });

  return { report_type: input.report_type, date_range: input.date_range, rows };
}

// TODO: Replace with real DB query
export async function reconcileStock(input: {
  branch?: BranchName;
  date: string;
}): Promise<Record<string, unknown>> {
  const branch = input.branch ?? "Main Showroom";
  const inventory = MOCK_DB.INVENTORY.filter((row) => row.branch === branch);
  const expected = inventory.reduce((sum, row) => sum + row.grams, 0);
  const physical = Number((expected - 1.7).toFixed(2));
  const variance = Number((physical - expected).toFixed(2));

  return {
    branch,
    date: input.date,
    expected_grams: expected,
    physical_grams: physical,
    variance_grams: variance,
    alert: Math.abs(variance) > 2,
  };
}

// TODO: Replace with real DB query
export async function getCustomerData(input: {
  segment?: CustomerSegment | "all";
  aging_bucket?: AgingBucket;
  last_visit_before?: string;
}): Promise<Record<string, unknown>> {
  const today = new Date().toISOString().slice(0, 10);
  const segment = input.segment ?? "all";

  const rows = MOCK_DB.CUSTOMERS.filter((customer) => {
    if (segment !== "all" && customer.segment !== segment) return false;
    if (input.last_visit_before && !(customer.last_visit_date < input.last_visit_before)) return false;
    const days = dayDiff(customer.outstanding_since_date, today);
    const bucket: AgingBucket = days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+";
    if (input.aging_bucket && bucket !== input.aging_bucket) return false;
    return true;
  }).map((customer) => {
    const days = dayDiff(customer.outstanding_since_date, today);
    const aging_bucket: AgingBucket =
      days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+";
    return { ...customer, aging_bucket };
  });

  return {
    segment,
    aging_bucket: input.aging_bucket ?? "all",
    total: rows.length,
    customers: rows,
  };
}

// TODO: Replace with real DB query
export async function createInvoice(input: {
  customer_id: string;
  items: Array<{
    item_id: string;
    description: string;
    gross_weight_g: number;
    net_weight_g: number;
    purity: Purity;
    metal_rate_per_g: number;
    making_charge: number;
    quantity: number;
  }>;
  advance_applied?: number;
}): Promise<Record<string, unknown>> {
  const lineItems = input.items.map((item) => {
    const metalValue = item.net_weight_g * item.metal_rate_per_g * item.quantity;
    const makingValue = item.making_charge * item.quantity;
    return {
      ...item,
      metal_value_inr: metalValue,
      making_value_inr: makingValue,
      line_subtotal_inr: metalValue + makingValue,
    };
  });

  const subtotal = lineItems.reduce((sum, row) => sum + row.line_subtotal_inr, 0);
  const totalMaking = lineItems.reduce((sum, row) => sum + row.making_value_inr, 0);
  const cgst = Number((totalMaking * 0.015).toFixed(2));
  const sgst = Number((totalMaking * 0.015).toFixed(2));
  const taxTotal = cgst + sgst;
  const beforeAdvance = subtotal + taxTotal;
  const requestedAdvance = input.advance_applied ?? 0;
  const cappedAdvance = Math.min(requestedAdvance, beforeAdvance);
  const warning =
    requestedAdvance > beforeAdvance
      ? "advance_applied exceeded subtotal and was capped automatically."
      : undefined;

  return {
    invoice_id: `INV-${Date.now().toString().slice(-6)}`,
    customer_id: input.customer_id,
    items: lineItems,
    subtotal_inr: subtotal,
    taxes: {
      cgst_1_5_pct_on_making: cgst,
      sgst_1_5_pct_on_making: sgst,
      total_gst_inr: taxTotal,
    },
    advance_applied_inr: cappedAdvance,
    grand_total_inr: Number((beforeAdvance - cappedAdvance).toFixed(2)),
    ...(warning ? { warning } : {}),
  };
}

// TODO: Replace with real DB query
export async function getBranches(): Promise<BranchName[]> {
  return [...MOCK_DB.BRANCHES];
}

// TODO: Replace with real DB query
export async function getArtisans(): Promise<ArtisanRecord[]> {
  return [...MOCK_DB.ARTISANS];
}

// TODO: Replace with real DB query
export async function getEmployees(): Promise<EmployeeRecord[]> {
  return [...MOCK_DB.EMPLOYEES];
}

// TODO: Replace with real DB query
export async function getSalesHistory(): Promise<SalesHistoryRecord[]> {
  return [...MOCK_DB.SALES_HISTORY];
}

// TODO: Replace with real DB query
export async function getCustomers(): Promise<CustomerRecord[]> {
  return [...MOCK_DB.CUSTOMERS];
}

// TODO: Replace with real DB query
export async function getPieceRateHistory(): Promise<PieceRateHistory[]> {
  return [...MOCK_DB.PIECE_RATE_HISTORY];
}

// Backward-compatibility exports used by existing route handlers.
export const ERP_BRANCHES = MOCK_DB.BRANCHES.map((name, index) => ({
  id: `BR-00${index + 1}`,
  name,
  city: name === "Workshop" ? "Secunderabad" : "Hyderabad",
}));

export const ERP_INVENTORY = MOCK_DB.INVENTORY.map((record, index) => ({
  branchId: `BR-00${MOCK_DB.BRANCHES.indexOf(record.branch) + 1}`,
  branchName: record.branch,
  metal: record.purity.includes("Silver") ? ("silver" as const) : ("gold" as const),
  purity: record.purity,
  availableGrams: Math.round(record.grams * 0.9),
  reservedGrams: Math.round(record.grams * 0.1),
  __row: index,
}));

export const ERP_ARTISANS = MOCK_DB.ARTISANS.map((artisan) => ({
  id: artisan.id,
  name: artisan.name,
  employeeType: "piece_rate" as const,
  specialization: artisan.specialization,
  pieceRatePerGram: artisan.per_unit_rate,
  fixedMonthlySalary: 0,
  payrollHistory: MOCK_DB.PIECE_RATE_HISTORY.filter((row) => row.artisan_id === artisan.id).map(
    (row) => ({
      month: row.month.toString(),
      year: row.year,
      gramsCompleted: row.units_completed,
      payout: row.units_completed * artisan.per_unit_rate,
    }),
  ),
}));

export const ERP_WORK_ORDERS = MOCK_DB.WORK_ORDERS.map((order) => ({
  id: order.id,
  artisanId: order.artisan_id,
  branchId: "BR-003",
  designRef: order.design_ref,
  status: order.status,
  metal: order.purity.includes("Silver") ? ("silver" as const) : ("gold" as const),
  purity: order.purity,
  metalWeight: order.metal_weight_g,
  dueDate: order.due_date,
  createdAt: order.created_date,
}));

export const ERP_CUSTOMERS = MOCK_DB.CUSTOMERS.map((customer) => ({
  id: customer.id,
  name: customer.name,
  segment: customer.segment === "new" ? ("retail" as const) : customer.segment,
  lastVisit: customer.last_visit_date,
  outstandingAmount: customer.outstanding_amount_inr,
  outstanding_since_date: customer.outstanding_since_date,
}));

export const ERP_SALES_90_DAYS = MOCK_DB.SALES_HISTORY.map((row) => ({
  date: row.date,
  branchId: `BR-00${MOCK_DB.BRANCHES.indexOf(row.branch) + 1}`,
  grossSales: row.gross_sales_inr,
  cogs: row.metal_cost_inr,
  operatingExpense: row.operating_expenses_inr,
}));

