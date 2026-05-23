const STORAGE_KEY = "wallbit_registry_api_key";

export function getRegistryApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setRegistryApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export function clearRegistryApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}
