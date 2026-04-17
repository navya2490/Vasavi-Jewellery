import { NextResponse } from "next/server";
import { z } from "zod";

import { createInvoiceHandler } from "@/lib/tool-handlers";

const ItemSchema = z.object({
  item_code: z.string().min(2).optional(),
  description: z.string().min(2),
  qty: z.number().positive(),
  rate: z.number().nonnegative(),
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
