import type { PayrollLineItem } from "@/lib/types/erp";

import { ARTISANS } from "@/lib/erp/mock-data";
import { delay, roundTo2, seededInt } from "@/lib/erp/helpers";

export async function listArtisans(input?: {
  branchId?: string;
}): Promise<Array<{ id: string; name: string; role: string; branchId: string }>> {
  await delay(300);
  return ARTISANS.filter((artisan) =>
    input?.branchId ? artisan.branchId === input.branchId : true,
  ).map(({ id, name, role, branchId }) => ({ id, name, role, branchId }));
}

export async function calculateMonthlyPayroll(input: {
  month: string;
  includeIncentives?: boolean;
}): Promise<{
  month: string;
  lineItems: PayrollLineItem[];
  totalNet: number;
}> {
  await delay(650);
  const includeIncentives = input.includeIncentives ?? true;

  const lineItems: PayrollLineItem[] = ARTISANS.map((artisan) => {
    const incentives = includeIncentives
      ? seededInt(`${artisan.id}:${input.month}:inc`, 1200, 6400)
      : 0;
    const deductions = seededInt(`${artisan.id}:${input.month}:ded`, 500, 2600);
    const netAmount = roundTo2(artisan.monthlyBase + incentives - deductions);

    return {
      artisanId: artisan.id,
      artisanName: artisan.name,
      baseAmount: artisan.monthlyBase,
      incentives,
      deductions,
      netAmount,
    };
  });

  return {
    month: input.month,
    lineItems,
    totalNet: roundTo2(lineItems.reduce((sum, item) => sum + item.netAmount, 0)),
  };
}

export async function submitPayroll(input: {
  month: string;
  reviewer: string;
  totalNet: number;
}): Promise<{
  month: string;
  approvalId: string;
  reviewer: string;
  postedAt: string;
  totalNet: number;
}> {
  await delay(500);
  const approvalSuffix = seededInt(
    `${input.month}:${input.reviewer}:${input.totalNet}`,
    1000,
    9999,
  );
  return {
    month: input.month,
    approvalId: `PAY-${approvalSuffix}`,
    reviewer: input.reviewer,
    postedAt: new Date().toISOString(),
    totalNet: input.totalNet,
  };
}
