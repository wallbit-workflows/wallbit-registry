import { registrySessionFetch } from "@/lib/registry-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const res = await registrySessionFetch("/api-keys", {
    method: "POST",
    body: body || "{}",
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
