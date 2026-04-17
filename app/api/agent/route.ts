import { NextResponse } from "next/server";
import { z } from "zod";

import {
  formatAgentEventForSse,
  runAgentLoop,
  type ConversationMessage,
} from "@/lib/agent";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const RequestSchema = z.object({
  mission: z.string(),
  conversation_history: z.array(MessageSchema).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const payload = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload",
        details: payload.error.flatten(),
      },
      { status: 400 },
    );
  }

  const mission = payload.data.mission.trim();
  if (!mission) {
    return NextResponse.json({ error: "Mission cannot be empty." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is missing. Configure environment variables." },
      { status: 500 },
    );
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const writeEvent = async (event: Parameters<typeof formatAgentEventForSse>[0]) => {
    await writer.write(encoder.encode(formatAgentEventForSse(event)));
  };

  void (async () => {
    try {
      await runAgentLoop({
        mission,
        conversationHistory: payload.data.conversation_history as ConversationMessage[] | undefined,
        maxIterations: 10,
        onEvent: writeEvent,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error while running mission agent.";

      await writeEvent({
        type: "final_answer",
        payload: {
          summary: `Agent failed: ${message}`,
          metrics: [],
          stepsExecuted: 0,
        },
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
