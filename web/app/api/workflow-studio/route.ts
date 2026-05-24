import { auth } from "@clerk/nextjs/server";
import { streamWorkflowStudio } from "@/lib/cursor-workflow-agent";
import {
  checkStudioRateLimit,
  studioRateLimitHeaders,
} from "@/lib/studio-rate-limit";
import {
  buildPromptWithAttachments,
  type StudioAttachment,
} from "@/lib/studio-attachments";
import { buildStudioUserMessage } from "@/lib/wallbit-workflow-skill-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudioRequest = {
  prompt?: string;
  agentId?: string;
  attachments?: StudioAttachment[];
};

function sseLine(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const rateLimit = await checkStudioRateLimit(userId);
  if (!rateLimit.ok) {
    const minutes = Math.max(1, Math.ceil(rateLimit.retryAfterSec / 60));
    return Response.json(
      {
        error: `Studio rate limit reached. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      },
      {
        status: 429,
        headers: studioRateLimitHeaders(rateLimit),
      },
    );
  }

  const apiKey = process.env.CURSOR_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      {
        error:
          "CURSOR_API_KEY is not set. Add it to web/.env (see .env.example).",
      },
      { status: 503 },
    );
  }

  let body: StudioRequest;
  try {
    body = (await request.json()) as StudioRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userPrompt = body.prompt?.trim() ?? "";
  const attachments = body.attachments ?? [];
  if (!userPrompt && attachments.length === 0) {
    return Response.json({ error: "prompt or attachments required" }, {
      status: 400,
    });
  }

  const withFiles = buildPromptWithAttachments(userPrompt, attachments);
  const prompt = buildStudioUserMessage(withFiles, Boolean(body.agentId));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const push = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseLine(event, data)));
      };

      try {
        for await (const item of streamWorkflowStudio({
          apiKey,
          prompt,
          agentId: body.agentId,
        })) {
          if (item.type === "agent") {
            push("agent", { agentId: item.agentId });
          } else if (item.type === "text") {
            push("text", { delta: item.delta });
          } else if (item.type === "done") {
            push("done", { result: item.result, runId: item.runId });
          } else if (item.type === "error") {
            push("error", {
              message: item.message,
              retryable: item.retryable,
            });
          }
        }
      } catch (err) {
        push("error", {
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...studioRateLimitHeaders(rateLimit),
    },
  });
}
