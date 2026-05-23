import { auth } from "@clerk/nextjs/server";
import { getRegistryURL } from "@/lib/api";

export async function registrySessionFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const { userId, getToken } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = await getToken();
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing session token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return fetch(`${getRegistryURL()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}
