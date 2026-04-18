import { NextResponse } from "next/server";
import { z } from "zod";

import { reconcileStockHandler } from "@/lib/tool-handlers";

const RequestSchema = z.object({
  branch: z.string().optional(),
  date: z.string().min(8),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const payload = RequestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      {
        error: "Invalid reconcile_stock payload.",
        details: payload.error.flatten(),
      },
      { status: 400 },
    );
  }

  // TODO: Replace with real DB query
  const result = await reconcileStockHandler(payload.data);
  return NextResponse.json(result);
}
