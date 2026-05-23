const PREVIEW_PALETTES = [
  { bg: "#3d3566", accent: "#7b61ff" },
  { bg: "#2d3d4f", accent: "#4dabf7" },
  { bg: "#3d3a2e", accent: "#fab005" },
  { bg: "#2f3d35", accent: "#51cf66" },
  { bg: "#4a2f3d", accent: "#ff6b9d" },
  { bg: "#2f3a4a", accent: "#74c0fc" },
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
  return PREVIEW_PALETTES[hash(key) % PREVIEW_PALETTES.length];
}

export function avatarColor(username: string) {
  return AVATAR_COLORS[hash(username) % AVATAR_COLORS.length];
}

export function initialsFor(name: string) {
  return name.slice(0, 1).toUpperCase();
}
