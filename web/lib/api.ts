import type { ListResponse, Metadata } from "./types";

const baseURL =
  process.env.NEXT_PUBLIC_REGISTRY_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";

/** Invalidate after publish so the home list refetches. */
export const WORKFLOWS_LIST_TAG = "registry-workflows";

type RegistryFetchInit = RequestInit & {
  next?: { revalidate?: number; tags?: string[] };
};

async function registryFetch<T>(
  path: string,
  init?: RegistryFetchInit,
): Promise<T> {
  const res = await fetch(`${baseURL}${path}`, {
    ...init,
    next: init?.next ?? { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`registry ${path}: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getRegistryURL() {
  return baseURL;
}

export async function listWorkflows(limit = 50, offset = 0) {
  return registryFetch<ListResponse>(`/workflows?limit=${limit}&offset=${offset}`, {
    next: { tags: [WORKFLOWS_LIST_TAG], revalidate: 60 },
  });
}

export async function getWorkflowMetadata(username: string, slug: string) {
  return registryFetch<Metadata>(`/workflows/${username}/${slug}`);
}

export function downloadWorkflowURL(username: string, slug: string) {
  return `${baseURL}/workflows/${username}/${slug}/download`;
}
