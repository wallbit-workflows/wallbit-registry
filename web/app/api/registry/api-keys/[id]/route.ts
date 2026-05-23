import { registrySessionFetch } from "@/lib/registry-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const res = await registrySessionFetch(`/api-keys/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (res.status === 204) {
    return new Response(null, { status: 204 });
  }

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
