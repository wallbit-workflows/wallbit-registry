const STORAGE_KEY = "wallbit_registry_issued_key_tokens";

function readMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function normalizeId(id: string) {
  return id.trim().toLowerCase();
}

function prefixKey(prefix: string) {
  return `p:${prefix.trim()}`;
}

export type IssuedKeyRef = {
  id?: string;
  prefix: string;
};

/** Remember full token in this browser (lookup by id and/or prefix). */
export function rememberIssuedKeyToken(token: string, ref: IssuedKeyRef) {
  const value = token.trim();
  if (!value || !ref.prefix.trim()) return;

  const map = readMap();
  map[prefixKey(ref.prefix)] = value;
  if (ref.id?.trim()) {
    map[normalizeId(ref.id)] = value;
  }
  writeMap(map);
}

export function getIssuedKeyToken(ref: IssuedKeyRef): string | null {
  const map = readMap();
  if (ref.id?.trim()) {
    const byId = map[normalizeId(ref.id)];
    if (byId) return byId;
  }
  if (ref.prefix?.trim()) {
    const byPrefix = map[prefixKey(ref.prefix)];
    if (byPrefix) return byPrefix;
  }
  return null;
}

export function forgetIssuedKeyToken(ref: IssuedKeyRef) {
  const map = readMap();
  if (ref.id?.trim()) {
    delete map[normalizeId(ref.id)];
  }
  if (ref.prefix?.trim()) {
    delete map[prefixKey(ref.prefix)];
  }
  writeMap(map);
}
