export type PublishWorkflowPayload = {
  apiKey: string;
  slug: string;
  version: string;
  description?: string;
  content: string;
  /** Set on first publish if the account has no username yet. */
  username?: string;
};

export type PublishWorkflowResult = {
  username: string;
  slug: string;
  version: string;
  digest: string;
};

export class PublishWorkflowError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PublishWorkflowError";
  }
}

export async function publishWorkflow(
  payload: PublishWorkflowPayload,
): Promise<PublishWorkflowResult> {
  const res = await fetch("/api/workflows/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as PublishWorkflowResult & { error?: string };

  if (!res.ok) {
    throw new PublishWorkflowError(
      data.error ?? "Failed to publish workflow",
      res.status,
    );
  }

  return data;
}
