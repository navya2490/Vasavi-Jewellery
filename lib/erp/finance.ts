// NOTE: This module is not wired into the active agent loop.
// It is preserved for future use. Active tools are in /lib/tool-handlers.ts

import { delay, roundTo2, seededInt } from "@/lib/erp/helpers";

export async function getLedgerSummary(input: {
  period: string;
}): Promise<{
  period: string;
  receivables: number;
  payables: number;
  cashOnHand: number;
  grossMarginPct: number;
}> {
  await delay(450);
  const receivables = seededInt(`${input.period}:recv`, 400000, 800000);
  const payables = seededInt(`${input.period}:pay`, 250000, 700000);
  const cashOnHand = seededInt(`${input.period}:cash`, 800000, 1500000);
  const grossMarginPct = roundTo2(seededInt(`${input.period}:margin`, 18, 32) + 0.21);

  return {
    period: input.period,
    receivables,
    payables,
    cashOnHand,
    grossMarginPct,
  };
}

export async function publishMissionReport(input: {
  title: string;
  owner: string;
  highlights: string[];
}): Promise<{
  reportId: string;
  title: string;
  owner: string;
  highlights: string[];
  publishedAt: string;
}> {
  await delay(320);
  const reportId = `MR-${seededInt(input.title + input.owner, 10000, 99999)}`;
  return {
    reportId,
    title: input.title,
    owner: input.owner,
    highlights: input.highlights,
    publishedAt: new Date().toISOString(),
  };
}
