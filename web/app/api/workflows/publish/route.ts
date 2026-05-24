import { revalidatePath, revalidateTag } from "next/cache";
import { WORKFLOWS_LIST_TAG, workflowContentTag } from "@/lib/api";
import { registrySessionFetch } from "@/lib/registry-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublishBody = {
  slug?: string;
  version?: string;
  description?: string;
  content?: string;
  username?: string;
};

export async function POST(request: Request) {
  let body: PublishBody;
  try {
    body = (await request.json()) as PublishBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = body.slug?.trim();
  const version = body.version?.trim();
  const content = body.content;

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
    return registrySessionFetch("/workflows", {
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
    const patchRes = await registrySessionFetch("/me", {
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

  if (res.ok) {
    revalidateTag(WORKFLOWS_LIST_TAG, { expire: 0 });
    revalidatePath("/");
    const published = data as { username?: string; slug?: string };
    if (published.username && published.slug) {
      revalidateTag(workflowContentTag(published.username, published.slug), {
        expire: 0,
      });
      revalidatePath(`/workflows/${published.username}/${published.slug}`);
    }
  }

  return Response.json(data, { status: res.status });
}
