import { NextResponse } from "next/server";
import { z } from "zod";

import { calculatePayrollHandler } from "@/lib/tool-handlers";

const RequestSchema = z.object({
  month: z.string().min(3),
  year: z.number().int().min(2000).max(2100),
  employee_type: z.enum(["fixed", "piece_rate"]).optional(),
});

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid calculate_payroll payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  // TODO: Replace with real DB query
  const result = await calculatePayrollHandler(parsed.data);
  return NextResponse.json(result);
}
