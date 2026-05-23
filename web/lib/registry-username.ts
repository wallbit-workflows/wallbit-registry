/** Matches internal/account/username.go */
export const REGISTRY_USERNAME_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

export function normalizeRegistryUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateRegistryUsername(raw: string): string | null {
  const username = normalizeRegistryUsername(raw);
  if (!REGISTRY_USERNAME_PATTERN.test(username)) {
    return "3–32 characters: lowercase letters, numbers, and hyphens (not at the ends)";
  }
  return null;
}
