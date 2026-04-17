import { NextResponse } from "next/server";
import { z } from "zod";

import { getCustomerDataHandler } from "@/lib/tool-handlers";

const RequestSchema = z.object({
  segment: z.string().optional(),
  last_visit_before: z.string().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json().catch(() => ({}))) as unknown;
  const parsed = RequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // TODO: Replace with real DB query
  const result = await getCustomerDataHandler(parsed.data);
  return NextResponse.json(result);
}
