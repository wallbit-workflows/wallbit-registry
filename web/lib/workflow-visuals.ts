/** Warm peach/cream backgrounds — visible on cloud-canvas (#e5e7eb). */
const PREVIEW_BACKGROUNDS = [
  "#fcddcc",
  "#fad4bc",
  "#f5c9b4",
  "#ffe0cc",
  "#ffd6c4",
  "#f8cfb8",
  "#fce4d4",
  "#ffe8d6",
] as const;

const AVATAR_COLORS = [
  "#7b61ff",
  "#4dabf7",
  "#51cf66",
  "#fab005",
  "#ff6b9d",
  "#74c0fc",
] as const;

function hash(key: string) {
  let n = 0;
  for (const c of key) n += c.charCodeAt(0);
  return n;
}

export function previewFor(key: string) {
  return PREVIEW_BACKGROUNDS[hash(key) % PREVIEW_BACKGROUNDS.length];
}

export function avatarColor(username: string) {
  return AVATAR_COLORS[hash(username) % AVATAR_COLORS.length];
}

export function initialsFor(name: string) {
  return name.slice(0, 1).toUpperCase();
}
