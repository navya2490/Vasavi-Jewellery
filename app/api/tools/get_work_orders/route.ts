import { NextResponse } from "next/server";
import { z } from "zod";

import { getWorkOrdersHandler } from "@/lib/tool-handlers";

const RequestSchema = z.object({
  status: z.string().optional(),
  artisan_id: z.string().optional(),
  overdue_only: z.boolean().optional(),
  date_range: z
    .object({
      from: z.string().min(8),
      to: z.string().min(8),
    })
    .optional(),
});

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid get_work_orders payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  // TODO: Replace with real DB query
  const result = await getWorkOrdersHandler(parsed.data);
  return NextResponse.json(result);
}
