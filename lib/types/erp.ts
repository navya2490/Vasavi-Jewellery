export interface Branch {
  id: string;
  name: string;
  city: string;
}

export interface GoldStockSnapshot {
  branchId: string;
  date: string;
  openingGrams: number;
  inwardGrams: number;
  outwardGrams: number;
  closingGrams: number;
}

export interface PayrollLineItem {
  artisanId: string;
  artisanName: string;
  baseAmount: number;
  incentives: number;
  deductions: number;
  netAmount: number;
}
