function nameToSlug(rawName: string): string {
  return rawName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Registry slug from the workflow `name:` field. */
export function slugFromYaml(yaml: string): string {
  const nameMatch = yaml.match(/^name:\s*(.+)\s*$/m);
  if (!nameMatch) return "workflow";

  const raw = nameMatch[1].trim().replace(/^['"]|['"]$/g, "");
  const slug = nameToSlug(raw);
  return slug || "workflow";
}

/** Semver for registry publish; optional top-level `semver:` in YAML, else 1.0.0. */
export function semverFromYaml(yaml: string): string {
  const semverMatch = yaml.match(/^semver:\s*['"]?([^'"\n]+)['"]?\s*$/m);
  if (semverMatch) return semverMatch[1].trim();
  return "1.0.0";
}

/** Derive a save filename from the workflow `name:` field in YAML. */
export function filenameFromYaml(yaml: string): string {
  const slug = slugFromYaml(yaml);
  return slug === "workflow" && !/^name:\s*.+$/m.test(yaml)
    ? "workflow.yaml"
    : `${slug}.yaml`;
}

export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
