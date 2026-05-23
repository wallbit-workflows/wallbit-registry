import { getRegistryURL } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublishBody = {
  apiKey?: string;
  slug?: string;
  version?: string;
  description?: string;
  content?: string;
  username?: string;
};

async function registryFetch(
  path: string,
  apiKey: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${getRegistryURL()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...init?.headers,
    },
    cache: "no-store",
  });
}

export async function POST(request: Request) {
  let body: PublishBody;
  try {
    body = (await request.json()) as PublishBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawKey = body.apiKey?.trim();
  const slug = body.slug?.trim();
  const version = body.version?.trim();
  const content = body.content;

  if (!rawKey) {
    return Response.json({ error: "API key is required" }, { status: 400 });
  }
  const apiKey = rawKey;

  if (!slug || !version || !content?.trim()) {
    return Response.json(
      { error: "slug, version, and content are required" },
      { status: 400 },
    );
  }

  const publishPayload = {
    slug,
    version,
    description: body.description?.trim() || undefined,
    content,
  };

  async function doPublish() {
    return registryFetch("/workflows", apiKey, {
      method: "POST",
      body: JSON.stringify(publishPayload),
    });
  }

  let res = await doPublish();
  let data: { error?: string } & Record<string, unknown> = await res.json();

  const needsUsername =
    res.status === 400 &&
    typeof data.error === "string" &&
    data.error.toLowerCase().includes("username");

  const username = body.username?.trim();
  if (needsUsername && username) {
    const patchRes = await registryFetch("/me", apiKey, {
      method: "PATCH",
      body: JSON.stringify({ username }),
    });
    const patchData = (await patchRes.json()) as { error?: string };
    if (!patchRes.ok) {
      return Response.json(
        { error: patchData.error ?? "Failed to set username" },
        { status: patchRes.status },
      );
    }
    res = await doPublish();
    data = await res.json();
  }

  return Response.json(data, { status: res.status });
}
