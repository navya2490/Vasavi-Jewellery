import { NextResponse } from "next/server";
import { z } from "zod";

import { getInventoryStatusHandler } from "@/lib/tool-handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z
  .object({
    branch: z.string().optional(),
    metal: z.enum(["gold", "silver"]).optional(),
    purity: z.string().optional(),
  })
  .strict();

export async function POST(request: Request): Promise<Response> {
  const payload = RequestSchema.safeParse(
    (await request.json().catch(() => ({}))) as unknown,
  );
  if (!payload.success) {
    return NextResponse.json(
      {
        error: "Invalid get_inventory_status payload",
        details: payload.error.flatten(),
      },
      { status: 400 },
    );
  }

  // TODO: Replace with real DB query
  const result = await getInventoryStatusHandler(payload.data);
  return NextResponse.json(result);
}
