import path from "node:path";
import { buildStudioUserMessage } from "@/lib/wallbit-workflow-skill-prompt";

const CURSOR_API_BASE = "https://api.cursor.com";
const WORKFLOW_MODEL_ID = "composer-2.5";

export type StudioStreamEvent =
  | { type: "agent"; agentId: string }
  | { type: "text"; delta: string }
  | { type: "done"; result: string; runId: string }
  | { type: "error"; message: string; retryable?: boolean };

type RunOptions = {
  apiKey: string;
  prompt: string;
  agentId?: string;
};

function basicAuth(apiKey: string): string {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

async function cursorJson<T>(
  apiKey: string,
  pathname: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${CURSOR_API_BASE}${pathname}`, {
    ...init,
    headers: {
      Authorization: basicAuth(apiKey),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      body ? `Cursor API ${res.status}: ${body}` : `Cursor API ${res.status}`,
    );
  }

  return res.json() as Promise<T>;
}

async function* streamViaCursorApi(
  options: RunOptions,
): AsyncGenerator<StudioStreamEvent> {
  const message = buildStudioUserMessage(
    options.prompt,
    Boolean(options.agentId),
  );

  let agentId = options.agentId;
  let runId: string;

  if (agentId) {
    const created = await cursorJson<{ run: { id: string } }>(
      options.apiKey,
      `/v1/agents/${agentId}/runs`,
      {
        method: "POST",
        body: JSON.stringify({
          prompt: { text: message },
          mode: "agent",
        }),
      },
    );
    runId = created.run.id;
  } else {
    const created = await cursorJson<{
      agent: { id: string };
      run: { id: string };
    }>(options.apiKey, "/v1/agents", {
      method: "POST",
      body: JSON.stringify({
        prompt: { text: message },
        model: { id: WORKFLOW_MODEL_ID },
        mode: "agent",
        name: "Wallbit Workflow Studio",
      }),
    });
    agentId = created.agent.id;
    runId = created.run.id;
  }

  yield { type: "agent", agentId };

  const streamRes = await fetch(
    `${CURSOR_API_BASE}/v1/agents/${agentId}/runs/${runId}/stream`,
    {
      headers: {
        Authorization: basicAuth(options.apiKey),
        Accept: "text/event-stream",
      },
    },
  );

  if (!streamRes.ok || !streamRes.body) {
    throw new Error(`Cursor stream failed (${streamRes.status})`);
  }

  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const lines = chunk.split("\n");
      let event = "";
      let data = "";

      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data = line.slice(5).trim();
      }

      if (!event || !data) continue;

      const payload = JSON.parse(data) as Record<string, unknown>;

      if (event === "assistant" && typeof payload.text === "string") {
        finalText += payload.text;
        yield { type: "text", delta: payload.text };
      }

      if (event === "result") {
        const text =
          typeof payload.text === "string" ? payload.text : finalText;
        const status = payload.status;
        if (status === "ERROR") {
          yield {
            type: "error",
            message: "The agent run finished with an error.",
          };
          return;
        }
        yield {
          type: "done",
          result: text,
          runId: typeof payload.runId === "string" ? payload.runId : runId,
        };
        return;
      }

      if (event === "error") {
        yield {
          type: "error",
          message:
            typeof payload.message === "string"
              ? payload.message
              : "Stream error",
        };
        return;
      }
    }
  }

  const terminal = await cursorJson<{
    status: string;
    result?: string;
    id: string;
  }>(options.apiKey, `/v1/agents/${agentId}/runs/${runId}`);

  if (terminal.status === "ERROR") {
    yield { type: "error", message: "The agent run finished with an error." };
    return;
  }

  yield {
    type: "done",
    result: terminal.result ?? finalText,
    runId: terminal.id,
  };
}

async function* streamViaCursorSdk(
  options: RunOptions,
): AsyncGenerator<StudioStreamEvent> {
  const { Agent, CursorAgentError } = await import("@cursor/sdk");
  const repoRoot = path.resolve(process.cwd(), "..");
  const message = buildStudioUserMessage(
    options.prompt,
    Boolean(options.agentId),
  );

  let agent: Awaited<ReturnType<typeof Agent.create>> | undefined;

  try {
    if (options.agentId) {
      agent = await Agent.resume(options.agentId, {
        apiKey: options.apiKey,
        model: { id: WORKFLOW_MODEL_ID },
      });
    } else {
      agent = await Agent.create({
        apiKey: options.apiKey,
        model: { id: WORKFLOW_MODEL_ID },
        local: {
          cwd: repoRoot,
          settingSources: [],
        },
      });
    }

    yield { type: "agent", agentId: agent.agentId };

    const run = await agent.send(message);

    for await (const event of run.stream()) {
      if (event.type === "assistant") {
        for (const block of event.message.content) {
          if (block.type === "text" && block.text) {
            yield { type: "text", delta: block.text };
          }
        }
      }
    }

    const result = await run.wait();
    if (result.status === "error") {
      yield { type: "error", message: "The agent run finished with an error." };
      return;
    }

    yield {
      type: "done",
      result: result.result ?? "",
      runId: result.id,
    };
  } catch (err) {
    if (err instanceof CursorAgentError) {
      yield {
        type: "error",
        message: err.message,
        retryable: err.isRetryable,
      };
      return;
    }
    throw err;
  } finally {
    if (agent) {
      await agent[Symbol.asyncDispose]();
    }
  }
}

let sdkLoadFailed = false;

/** Local @cursor/sdk needs a writable FS; Vercel/Lambda cannot mkdir sdk-agent-store. */
function preferCursorCloudApi(): boolean {
  if (
    process.env.CURSOR_WORKFLOW_USE_API === "1" ||
    process.env.CURSOR_WORKFLOW_USE_API === "true"
  ) {
    return true;
  }
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function shouldFallbackSdkToApi(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("bindings file") ||
    message.includes("sqlite3") ||
    message.includes("sdk-agent-store") ||
    message.includes("ENOENT")
  );
}

/** Stream workflow YAML generation via @cursor/sdk, falling back to the Cloud Agents REST API. */
export async function* streamWorkflowStudio(
  options: RunOptions,
): AsyncGenerator<StudioStreamEvent> {
  const useApi = preferCursorCloudApi();

  if (!useApi && !sdkLoadFailed) {
    try {
      yield* streamViaCursorSdk(options);
      return;
    } catch (err) {
      if (shouldFallbackSdkToApi(err)) {
        sdkLoadFailed = true;
      } else {
        throw err;
      }
    }
  }

  yield* streamViaCursorApi(options);
}
