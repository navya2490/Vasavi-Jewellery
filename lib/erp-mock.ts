export interface BranchRecord {
  id: string;
  name: string;
  city: string;
}

export interface InventoryRecord {
  branchId: string;
  branchName: string;
  metal: "gold" | "silver";
  purity: string;
  availableGrams: number;
  reservedGrams: number;
}

export interface ArtisanRecord {
  id: string;
  name: string;
  employeeType: "piece_rate" | "fixed";
  specialization: string;
  pieceRatePerGram: number;
  fixedMonthlySalary: number;
  payrollHistory: Array<{
    month: string;
    year: number;
    gramsCompleted: number;
    payout: number;
  }>;
}

export interface WorkOrderRecord {
  id: string;
  artisanId: string;
  branchId: string;
  designRef: string;
  status: "pending" | "in_progress" | "qc_hold" | "ready_dispatch";
  metal: "gold" | "silver";
  purity: string;
  metalWeight: number;
  dueDate: string;
  createdAt: string;
}

export interface SalesHistoryRecord {
  date: string;
  branchId: string;
  grossSales: number;
  cogs: number;
  operatingExpense: number;
}

export interface CustomerRecord {
  id: string;
  name: string;
  segment: "retail" | "wholesale" | "vip";
  lastVisit: string;
  outstandingAmount: number;
}

export const ERP_BRANCHES: BranchRecord[] = [
  { id: "BR-001", name: "Main Showroom", city: "Hyderabad" },
  { id: "BR-002", name: "Mall Outlet", city: "Hyderabad" },
  { id: "BR-003", name: "Workshop", city: "Secunderabad" },
];

export const ERP_INVENTORY: InventoryRecord[] = [
  {
    branchId: "BR-001",
    branchName: "Main Showroom",
    metal: "gold",
    purity: "24K",
    availableGrams: 228,
    reservedGrams: 18,
  },
  {
    branchId: "BR-001",
    branchName: "Main Showroom",
    metal: "gold",
    purity: "22K",
    availableGrams: 524,
    reservedGrams: 36,
  },
  {
    branchId: "BR-001",
    branchName: "Main Showroom",
    metal: "gold",
    purity: "18K",
    availableGrams: 176,
    reservedGrams: 10,
  },
  {
    branchId: "BR-002",
    branchName: "Mall Outlet",
    metal: "gold",
    purity: "24K",
    availableGrams: 165,
    reservedGrams: 12,
  },
  {
    branchId: "BR-002",
    branchName: "Mall Outlet",
    metal: "gold",
    purity: "22K",
    availableGrams: 462,
    reservedGrams: 30,
  },
  {
    branchId: "BR-002",
    branchName: "Mall Outlet",
    metal: "gold",
    purity: "18K",
    availableGrams: 148,
    reservedGrams: 8,
  },
  {
    branchId: "BR-003",
    branchName: "Workshop",
    metal: "gold",
    purity: "24K",
    availableGrams: 182,
    reservedGrams: 9,
  },
  {
    branchId: "BR-003",
    branchName: "Workshop",
    metal: "gold",
    purity: "22K",
    availableGrams: 508,
    reservedGrams: 34,
  },
  {
    branchId: "BR-003",
    branchName: "Workshop",
    metal: "gold",
    purity: "18K",
    availableGrams: 196,
    reservedGrams: 15,
  },
  {
    branchId: "BR-001",
    branchName: "Main Showroom",
    metal: "silver",
    purity: "999",
    availableGrams: 2480,
    reservedGrams: 120,
  },
  {
    branchId: "BR-002",
    branchName: "Mall Outlet",
    metal: "silver",
    purity: "999",
    availableGrams: 1940,
    reservedGrams: 92,
  },
  {
    branchId: "BR-003",
    branchName: "Workshop",
    metal: "silver",
    purity: "999",
    availableGrams: 2125,
    reservedGrams: 87,
  },
];

export const ERP_ARTISANS: ArtisanRecord[] = [
  {
    id: "ART-001",
    name: "Ravi Kumar",
    employeeType: "piece_rate",
    specialization: "Temple Jewellery",
    pieceRatePerGram: 220,
    fixedMonthlySalary: 0,
    payrollHistory: [
      { month: "Jan", year: 2026, gramsCompleted: 145, payout: 31900 },
      { month: "Feb", year: 2026, gramsCompleted: 138, payout: 30360 },
      { month: "Mar", year: 2026, gramsCompleted: 152, payout: 33440 },
    ],
  },
  {
    id: "ART-002",
    name: "Suma Reddy",
    employeeType: "piece_rate",
    specialization: "Filigree",
    pieceRatePerGram: 240,
    fixedMonthlySalary: 0,
    payrollHistory: [
      { month: "Jan", year: 2026, gramsCompleted: 124, payout: 29760 },
      { month: "Feb", year: 2026, gramsCompleted: 131, payout: 31440 },
      { month: "Mar", year: 2026, gramsCompleted: 127, payout: 30480 },
    ],
  },
  {
    id: "ART-003",
    name: "Imran Shaik",
    employeeType: "piece_rate",
    specialization: "Stone Setting",
    pieceRatePerGram: 205,
    fixedMonthlySalary: 0,
    payrollHistory: [
      { month: "Jan", year: 2026, gramsCompleted: 119, payout: 24395 },
      { month: "Feb", year: 2026, gramsCompleted: 128, payout: 26240 },
      { month: "Mar", year: 2026, gramsCompleted: 122, payout: 25010 },
    ],
  },
  {
    id: "ART-004",
    name: "Kiran Vemula",
    employeeType: "piece_rate",
    specialization: "Casting",
    pieceRatePerGram: 210,
    fixedMonthlySalary: 0,
    payrollHistory: [
      { month: "Jan", year: 2026, gramsCompleted: 111, payout: 23310 },
      { month: "Feb", year: 2026, gramsCompleted: 118, payout: 24780 },
      { month: "Mar", year: 2026, gramsCompleted: 126, payout: 26460 },
    ],
  },
  {
    id: "ART-005",
    name: "Anitha Paul",
    employeeType: "fixed",
    specialization: "Quality Control",
    pieceRatePerGram: 0,
    fixedMonthlySalary: 38000,
    payrollHistory: [
      { month: "Jan", year: 2026, gramsCompleted: 0, payout: 38000 },
      { month: "Feb", year: 2026, gramsCompleted: 0, payout: 38000 },
      { month: "Mar", year: 2026, gramsCompleted: 0, payout: 38000 },
    ],
  },
  {
    id: "ART-006",
    name: "Pradeep N",
    employeeType: "fixed",
    specialization: "Polishing",
    pieceRatePerGram: 0,
    fixedMonthlySalary: 32500,
    payrollHistory: [
      { month: "Jan", year: 2026, gramsCompleted: 0, payout: 32500 },
      { month: "Feb", year: 2026, gramsCompleted: 0, payout: 32500 },
      { month: "Mar", year: 2026, gramsCompleted: 0, payout: 32500 },
    ],
  },
  {
    id: "ART-007",
    name: "Yasmin Begum",
    employeeType: "piece_rate",
    specialization: "Chain Making",
    pieceRatePerGram: 195,
    fixedMonthlySalary: 0,
    payrollHistory: [
      { month: "Jan", year: 2026, gramsCompleted: 142, payout: 27690 },
      { month: "Feb", year: 2026, gramsCompleted: 136, payout: 26520 },
      { month: "Mar", year: 2026, gramsCompleted: 149, payout: 29055 },
    ],
  },
  {
    id: "ART-008",
    name: "Manoj Gupta",
    employeeType: "piece_rate",
    specialization: "Antique Finish",
    pieceRatePerGram: 230,
    fixedMonthlySalary: 0,
    payrollHistory: [
      { month: "Jan", year: 2026, gramsCompleted: 132, payout: 30360 },
      { month: "Feb", year: 2026, gramsCompleted: 129, payout: 29670 },
      { month: "Mar", year: 2026, gramsCompleted: 141, payout: 32430 },
    ],
  },
];

export const ERP_WORK_ORDERS: WorkOrderRecord[] = [
  {
    id: "WO-22001",
    artisanId: "ART-001",
    branchId: "BR-003",
    designRef: "DL-Temple-441",
    status: "in_progress",
    metal: "gold",
    purity: "22K",
    metalWeight: 72,
    dueDate: "2026-04-22",
    createdAt: "2026-04-10",
  },
  {
    id: "WO-22002",
    artisanId: "ART-002",
    branchId: "BR-003",
    designRef: "DL-Filigree-812",
    status: "pending",
    metal: "gold",
    purity: "22K",
    metalWeight: 58,
    dueDate: "2026-04-25",
    createdAt: "2026-04-12",
  },
  {
    id: "WO-22003",
    artisanId: "ART-003",
    branchId: "BR-003",
    designRef: "DL-Stone-127",
    status: "qc_hold",
    metal: "gold",
    purity: "18K",
    metalWeight: 41,
    dueDate: "2026-04-18",
    createdAt: "2026-04-06",
  },
  {
    id: "WO-22004",
    artisanId: "ART-004",
    branchId: "BR-003",
    designRef: "DL-Cast-204",
    status: "ready_dispatch",
    metal: "gold",
    purity: "24K",
    metalWeight: 33,
    dueDate: "2026-04-17",
    createdAt: "2026-04-05",
  },
  {
    id: "WO-22005",
    artisanId: "ART-007",
    branchId: "BR-003",
    designRef: "DL-Chain-018",
    status: "in_progress",
    metal: "gold",
    purity: "22K",
    metalWeight: 49,
    dueDate: "2026-04-23",
    createdAt: "2026-04-11",
  },
  {
    id: "WO-22006",
    artisanId: "ART-008",
    branchId: "BR-003",
    designRef: "DL-Antique-716",
    status: "pending",
    metal: "gold",
    purity: "22K",
    metalWeight: 64,
    dueDate: "2026-04-26",
    createdAt: "2026-04-13",
  },
  {
    id: "WO-22007",
    artisanId: "ART-001",
    branchId: "BR-003",
    designRef: "DL-Temple-228",
    status: "in_progress",
    metal: "gold",
    purity: "22K",
    metalWeight: 54,
    dueDate: "2026-04-24",
    createdAt: "2026-04-12",
  },
  {
    id: "WO-22008",
    artisanId: "ART-002",
    branchId: "BR-003",
    designRef: "DL-Filigree-333",
    status: "ready_dispatch",
    metal: "gold",
    purity: "18K",
    metalWeight: 37,
    dueDate: "2026-04-16",
    createdAt: "2026-04-02",
  },
  {
    id: "WO-22009",
    artisanId: "ART-003",
    branchId: "BR-003",
    designRef: "DL-Stone-905",
    status: "pending",
    metal: "gold",
    purity: "22K",
    metalWeight: 46,
    dueDate: "2026-04-27",
    createdAt: "2026-04-14",
  },
  {
    id: "WO-22010",
    artisanId: "ART-004",
    branchId: "BR-003",
    designRef: "DL-Cast-650",
    status: "in_progress",
    metal: "gold",
    purity: "24K",
    metalWeight: 59,
    dueDate: "2026-04-25",
    createdAt: "2026-04-13",
  },
  {
    id: "WO-22011",
    artisanId: "ART-007",
    branchId: "BR-003",
    designRef: "DL-Chain-231",
    status: "pending",
    metal: "gold",
    purity: "22K",
    metalWeight: 43,
    dueDate: "2026-04-29",
    createdAt: "2026-04-15",
  },
  {
    id: "WO-22012",
    artisanId: "ART-008",
    branchId: "BR-003",
    designRef: "DL-Antique-500",
    status: "qc_hold",
    metal: "gold",
    purity: "18K",
    metalWeight: 32,
    dueDate: "2026-04-20",
    createdAt: "2026-04-08",
  },
  {
    id: "WO-22013",
    artisanId: "ART-001",
    branchId: "BR-003",
    designRef: "DL-Temple-112",
    status: "pending",
    metal: "gold",
    purity: "22K",
    metalWeight: 48,
    dueDate: "2026-04-28",
    createdAt: "2026-04-15",
  },
  {
    id: "WO-22014",
    artisanId: "ART-002",
    branchId: "BR-003",
    designRef: "DL-Filigree-190",
    status: "in_progress",
    metal: "gold",
    purity: "22K",
    metalWeight: 57,
    dueDate: "2026-04-24",
    createdAt: "2026-04-11",
  },
  {
    id: "WO-22015",
    artisanId: "ART-007",
    branchId: "BR-003",
    designRef: "DL-Chain-095",
    status: "ready_dispatch",
    metal: "gold",
    purity: "24K",
    metalWeight: 29,
    dueDate: "2026-04-18",
    createdAt: "2026-04-07",
  },
];

export const ERP_CUSTOMERS: CustomerRecord[] = [
  {
    id: "CUS-1001",
    name: "Sree Lakshmi Jewels",
    segment: "wholesale",
    lastVisit: "2026-02-18",
    outstandingAmount: 185000,
  },
  {
    id: "CUS-1002",
    name: "Niharika Gold Studio",
    segment: "retail",
    lastVisit: "2026-04-03",
    outstandingAmount: 22800,
  },
  {
    id: "CUS-1003",
    name: "Meera Heritage Buyers",
    segment: "vip",
    lastVisit: "2026-01-22",
    outstandingAmount: 0,
  },
  {
    id: "CUS-1004",
    name: "Aaradhya Collections",
    segment: "retail",
    lastVisit: "2026-03-11",
    outstandingAmount: 12650,
  },
  {
    id: "CUS-1005",
    name: "Sampurna Bullion",
    segment: "wholesale",
    lastVisit: "2025-12-29",
    outstandingAmount: 249500,
  },
  {
    id: "CUS-1006",
    name: "Priya Family Gold",
    segment: "vip",
    lastVisit: "2026-04-08",
    outstandingAmount: 8400,
  },
];

const salesStartDate = new Date("2026-01-17T00:00:00Z");

export const ERP_SALES_90_DAYS: SalesHistoryRecord[] = Array.from(
  { length: 90 },
  (_, dayOffset) => {
    const date = new Date(salesStartDate);
    date.setUTCDate(salesStartDate.getUTCDate() + dayOffset);
    const branch = ERP_BRANCHES[dayOffset % ERP_BRANCHES.length];
    const baseline = 320000 + (dayOffset % 11) * 7500;
    const weekendBump = dayOffset % 7 >= 5 ? 42000 : 0;
    const grossSales = baseline + weekendBump;
    const cogs = Math.round(grossSales * 0.74);
    const operatingExpense = 42000 + (dayOffset % 5) * 1900;

    return {
      date: date.toISOString().slice(0, 10),
      branchId: branch.id,
      grossSales,
      cogs,
      operatingExpense,
    };
  },
);
