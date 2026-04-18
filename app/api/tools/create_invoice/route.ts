import { NextResponse } from "next/server";
import { z } from "zod";

import { createInvoiceHandler } from "@/lib/tool-handlers";

const ItemSchema = z.object({
  item_id: z.string().min(2),
  description: z.string().min(2),
  metal_value: z.number().nonnegative(),
  making_charge: z.number().nonnegative(),
  quantity: z.number().positive(),
});

const CreateInvoiceSchema = z.object({
  customer_id: z.string().min(2),
  items: z.array(ItemSchema).min(1),
  advance_applied: z.number().nonnegative().optional(),
});

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json()) as unknown;
  const parsed = CreateInvoiceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid create_invoice payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // TODO: Replace with real DB query
  const data = await createInvoiceHandler(parsed.data);
  return NextResponse.json(data);
}
