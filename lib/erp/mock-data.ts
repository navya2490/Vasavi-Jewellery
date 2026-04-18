// NOTE: This module is not wired into the active agent loop.
// It is preserved for future use. Active tools are in /lib/tool-handlers.ts
import type { Branch } from "@/lib/types/erp";

export interface Artisan {
  id: string;
  name: string;
  role: string;
  branchId: string;
  monthlyBase: number;
}

export const BRANCHES: Branch[] = [
  { id: "BLR-HQ", name: "Bengaluru HQ", city: "Bengaluru" },
  { id: "HYD-CEN", name: "Hyderabad Central", city: "Hyderabad" },
  { id: "MUM-FRT", name: "Mumbai Fort", city: "Mumbai" },
  { id: "CHE-TN", name: "Chennai T Nagar", city: "Chennai" },
];

export const ARTISANS: Artisan[] = [
  {
    id: "ART-1001",
    name: "Kiran Rao",
    role: "Polisher",
    branchId: "BLR-HQ",
    monthlyBase: 42000,
  },
  {
    id: "ART-1002",
    name: "Nivedita Shah",
    role: "Stone Setter",
    branchId: "HYD-CEN",
    monthlyBase: 46500,
  },
  {
    id: "ART-1003",
    name: "Abdul Kareem",
    role: "Caster",
    branchId: "MUM-FRT",
    monthlyBase: 51000,
  },
  {
    id: "ART-1004",
    name: "Sahana Iyer",
    role: "Engraver",
    branchId: "CHE-TN",
    monthlyBase: 43800,
  },
  {
    id: "ART-1005",
    name: "Dinesh Patil",
    role: "Bench Jeweler",
    branchId: "BLR-HQ",
    monthlyBase: 47400,
  },
];
