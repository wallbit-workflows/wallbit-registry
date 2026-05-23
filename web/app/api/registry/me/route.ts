import { registrySessionFetch } from "@/lib/registry-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const res = await registrySessionFetch("/me");
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function PATCH(request: Request) {
  const body = await request.text();
  const res = await registrySessionFetch("/me", {
    method: "PATCH",
    body,
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
