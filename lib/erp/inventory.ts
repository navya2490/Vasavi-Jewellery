import type { GoldStockSnapshot } from "@/lib/types/erp";

import { BRANCHES } from "@/lib/erp/mock-data";
import { delay, roundTo2, seededInt } from "@/lib/erp/helpers";

export async function listBranches(): Promise<typeof BRANCHES> {
  await delay(350);
  return BRANCHES;
}

export async function getGoldStockSnapshot(input: {
  branchId: string;
  date: string;
}): Promise<GoldStockSnapshot> {
  await delay(550);

  const openingGrams = seededInt(`${input.branchId}:${input.date}:open`, 1200, 2500);
  const inwardGrams = seededInt(`${input.branchId}:${input.date}:in`, 80, 250);
  const outwardGrams = seededInt(`${input.branchId}:${input.date}:out`, 60, 180);
  const closingGrams = roundTo2(openingGrams + inwardGrams - outwardGrams);

  return {
    branchId: input.branchId,
    date: input.date,
    openingGrams,
    inwardGrams,
    outwardGrams,
    closingGrams,
  };
}

export async function reconcileGoldStock(input: {
  date: string;
  toleranceGrams?: number;
}): Promise<{
  date: string;
  toleranceGrams: number;
  reconciled: Array<{
    branchId: string;
    expectedClosing: number;
    countedClosing: number;
    variance: number;
    status: "ok" | "investigate";
  }>;
  totalVariance: number;
}> {
  await delay(700);
  const tolerance = input.toleranceGrams ?? 7.5;
  const reconciled = BRANCHES.map((branch) => {
    const expectedClosing = seededInt(`${branch.id}:${input.date}:exp`, 1200, 2600);
    const drift = seededInt(`${branch.id}:${input.date}:drift`, -12, 12);
    const countedClosing = expectedClosing + drift;
    const variance = roundTo2(countedClosing - expectedClosing);

    return {
      branchId: branch.id,
      expectedClosing,
      countedClosing,
      variance,
      status: Math.abs(variance) <= tolerance ? ("ok" as const) : ("investigate" as const),
    };
  });

  const totalVariance = roundTo2(
    reconciled.reduce((sum, branchVariance) => sum + branchVariance.variance, 0),
  );

  return {
    date: input.date,
    toleranceGrams: tolerance,
    reconciled,
    totalVariance,
  };
}
