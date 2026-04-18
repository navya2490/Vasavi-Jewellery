import { NextResponse } from "next/server";
import { z } from "zod";

import { generateReportHandler } from "@/lib/tool-handlers";

const RequestSchema = z.object({
  report_type: z.enum([
    "daily_stock",
    "pl_summary",
    "artisan_productivity",
    "customer_aging",
  ]),
  date_range: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
  }),
});

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  // TODO: Replace with real DB query
  const result = await generateReportHandler({
    report_type: parsed.data.report_type,
    date_range: {
      from: parsed.data.date_range.from ?? parsed.data.date_range.start ?? "2026-04-01",
      to: parsed.data.date_range.to ?? parsed.data.date_range.end ?? "2026-04-30",
    },
  });

  return NextResponse.json({
    tool: "generate_report",
    result,
    note: "TODO: Replace with real DB query",
  });
}
