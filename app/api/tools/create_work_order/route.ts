import { NextResponse } from "next/server";
import { z } from "zod";

import { createWorkOrderHandler } from "@/lib/tool-handlers";

const RequestSchema = z.object({
  artisan_id: z.string().min(1),
  metal_weight: z.number().positive(),
  purity: z.string().min(1),
  design_ref: z.string().min(1),
  due_date: z.string().min(1),
});

export async function POST(request: Request): Promise<Response> {
  const parsedBody = RequestSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload",
        details: parsedBody.error.flatten(),
      },
      { status: 400 },
    );
  }

  // TODO: Replace with real DB query
  const result = await createWorkOrderHandler(parsedBody.data);
  return NextResponse.json(result);
}
