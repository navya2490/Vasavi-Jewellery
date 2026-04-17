import { NextResponse } from "next/server";
import { z } from "zod";

import { runAgent } from "@/lib/agent";
import { toSseEvent } from "@/lib/sse";
import type { MissionEvent, MissionExecutionRequest } from "@/lib/types/mission";

const RequestSchema = z.object({
  mission: z.string().min(10),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const parsedBody = RequestSchema.safeParse(
    (await request.json()) as MissionExecutionRequest,
  );
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload",
        details: parsedBody.error.flatten(),
      },
      { status: 400 },
    );
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const writeEvent = async (event: MissionEvent): Promise<void> => {
    await writer.write(encoder.encode(toSseEvent(event)));
  };

  void (async () => {
    try {
      await runAgent({
        mission: parsedBody.data.mission,
        onEvent: writeEvent,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Mission execution failed unexpectedly";

      await writeEvent({
        type: "mission_failed",
        timestamp: new Date().toISOString(),
        error: message,
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
