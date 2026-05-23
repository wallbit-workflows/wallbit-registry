/** Max workflow YAML size (matches internal/workflows/publish.go). */
export const MAX_WORKFLOW_YAML_BYTES = 256 << 10;

export function isYamlFilename(name: string): boolean {
  return /\.ya?ml$/i.test(name);
}

export async function readWorkflowYamlFile(file: File): Promise<string> {
  if (!isYamlFilename(file.name)) {
    throw new Error("Choose a .yaml or .yml file");
  }
  if (file.size > MAX_WORKFLOW_YAML_BYTES) {
    throw new Error("File must be 256 KiB or smaller");
  }
  return file.text();
}
